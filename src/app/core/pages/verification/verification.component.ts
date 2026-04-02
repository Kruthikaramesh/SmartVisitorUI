import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SecurityDashboardService,
  VerificationResult
} from '../../../features/security/services/security-dashboard.service';
import jsQR from 'jsqr';

type ScanMode = 'token' | 'camera' | 'upload';

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
}

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly verificationService = inject(SecurityDashboardService);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  mode: ScanMode = 'token';
  extractMessage = '';
  uploadedFileName = '';
  uploadedPreviewUrl = '';
  verificationResult?: VerificationResult;

  cameraSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  readonly form = this.fb.group({
    token: ['', [Validators.required]],
    remarks: ['']
  });

  private stream?: MediaStream;
  private frameScanHandle = 0;
  private readonly scanCanvas = document.createElement('canvas');

  ngAfterViewInit(): void {
    if (this.mode === 'camera') this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.revokePreview();
  }

  // ── Mode ──────────────────────────────────────────────────────────────────
  setMode(mode: ScanMode): void {
    this.mode = mode;
    this.extractMessage = '';
    if (mode === 'camera') {
      setTimeout(() => this.startCamera(), 0);
      return;
    }
    this.stopCamera();
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  verify(): void {
    const token = this.form.controls.token.value?.trim();
    if (!token) { this.form.controls.token.markAsTouched(); return; }

    const remarks = this.form.controls.remarks.value?.trim() || '';
    this.verificationService.verifyToken(token, remarks, this.mode).subscribe({
      next: result => {
        this.verificationResult = result;
        this.extractMessage = `Token ${result.token} verified via ${this.mode} mode.`;
      },
      error: () => {
        this.verificationResult = {
          status: 'denied',
          title: 'Access Review Required',
          details: 'Verification failed due to a server error.',
          checkinMessage: 'Try again or contact admin.',
          token
        };
        this.extractMessage = 'Verification request failed. Please retry.';
      }
    });
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  async onUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadedFileName = file.name;
    this.revokePreview();
    this.uploadedPreviewUrl = URL.createObjectURL(file);

    try {
      const img = await this.fileToImage(file);
      const payload = await this.readBarcodeFromSource(img);
      if (payload) {
        this.form.patchValue({ token: payload });
        this.extractMessage = 'QR content extracted from uploaded image.';
      } else {
        this.extractMessage = 'No QR code detected. Please try another image.';
      }
    } catch {
      this.extractMessage = 'Could not read the image. Please retry.';
    }
  }

  // ── Result styling helpers ────────────────────────────────────────────────
  resultPanelClass(): string {
    const s = this.verificationResult?.status;
    if (s === 'approved') return 'result-panel--granted';
    if (s === 'denied') return 'result-panel--denied';
    return 'result-panel--review';
  }

  resultIconClass(): string {
    const s = this.verificationResult?.status;
    if (s === 'approved') return 'stat-icon--green';
    if (s === 'denied') return 'stat-icon--red';
    return 'stat-icon--gray';
  }

  resultValueClass(): string {
    const s = this.verificationResult?.status;
    if (s === 'approved') return 'stat-value--granted';
    if (s === 'denied') return 'stat-value--denied';
    return '';
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  private async startCamera(): Promise<void> {
    if (!this.cameraSupported || !this.videoEl) return;
    this.stopCamera();
    try {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      const video = this.videoEl.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.scanFrames();
    } catch {
      this.extractMessage = 'Camera access denied or unavailable on this device.';
    }
  }

  private stopCamera(): void {
    if (this.frameScanHandle) { cancelAnimationFrame(this.frameScanHandle); this.frameScanHandle = 0; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = undefined; }
  }

  private scanFrames(): void {
    const loop = async () => {
      const video = this.videoEl?.nativeElement;
      if (!video || this.mode !== 'camera') return;
      const token = await this.readBarcodeFromSource(video);
      if (token) {
        this.form.patchValue({ token });
        this.extractMessage = 'QR content extracted from live camera.';
      }
      this.frameScanHandle = requestAnimationFrame(loop);
    };
    this.frameScanHandle = requestAnimationFrame(loop);
  }

  // ── QR Decode ─────────────────────────────────────────────────────────────
  private async readBarcodeFromSource(source: CanvasImageSource): Promise<string | null> {
    const detector = this.createBarcodeDetector();
    if (detector) {
      try {
        const codes = await detector.detect(source);
        const first = codes.find(c => !!c.rawValue)?.rawValue;
        if (first) return first.trim();
      } catch { /* fall through */ }
    }
    return this.decodeWithJsQr(source);
  }

  private createBarcodeDetector(): BarcodeDetectorLike | null {
    const ctor = (window as any).BarcodeDetector;
    return ctor ? new ctor({ formats: ['qr_code'] }) : null;
  }

  private decodeWithJsQr(source: CanvasImageSource): string | null {
    const canvas = this.scanCanvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    const dim = this.getSourceDimensions(source);
    if (!dim || dim.width === 0 || dim.height === 0) return null;
    canvas.width = dim.width; canvas.height = dim.height;
    context.drawImage(source, 0, 0, dim.width, dim.height);
    const imageData = context.getImageData(0, 0, dim.width, dim.height);
    return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })?.data?.trim() || null;
  }

  private getSourceDimensions(source: CanvasImageSource): { width: number; height: number } | null {
    if (source instanceof HTMLVideoElement) return { width: source.videoWidth, height: source.videoHeight };
    if (source instanceof HTMLImageElement) return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
    if (source instanceof HTMLCanvasElement) return { width: source.width, height: source.height };
    return null;
  }

  private fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = reader.result as string;
      };
      reader.onerror = () => reject();
      reader.readAsDataURL(file);
    });
  }

  private revokePreview(): void {
    if (this.uploadedPreviewUrl) { URL.revokeObjectURL(this.uploadedPreviewUrl); this.uploadedPreviewUrl = ''; }
  }
}
