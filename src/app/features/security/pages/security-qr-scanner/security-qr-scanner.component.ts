import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  SecurityDashboardService,
  VerificationResult
} from '../../services/security-dashboard.service';

type ScanMode = 'token' | 'camera' | 'upload';

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
}

@Component({
  selector: 'app-security-qr-scanner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security-qr-scanner.component.html',
  styleUrls: ['./security-qr-scanner.component.css']
})
export class SecurityQrScannerComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly securityService = inject(SecurityDashboardService);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  mode: ScanMode = 'token';
  extractMessage = '';
  uploadedFileName = '';
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

  ngAfterViewInit(): void {
    if (this.mode === 'camera') {
      this.startCamera();
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setMode(mode: ScanMode): void {
    this.mode = mode;
    this.extractMessage = '';
    this.uploadedFileName = '';

    if (mode === 'camera') {
      this.startCamera();
      return;
    }

    this.stopCamera();
  }

  verify(): void {
    const token = this.form.controls.token.value?.trim();
    if (!token) {
      this.form.controls.token.markAsTouched();
      return;
    }

    const remarks = this.form.controls.remarks.value?.trim() || '';
    this.verificationResult = this.securityService.verifyToken(token, remarks, this.mode);
    this.extractMessage = `Token ${this.verificationResult.token} ready for verification.`;
  }

  async onUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    this.uploadedFileName = file.name;

    try {
      const img = await this.fileToImage(file);
      const payload = await this.readBarcodeFromSource(img);

      if (payload) {
        this.form.patchValue({ token: payload });
        this.extractMessage = 'QR content extracted from uploaded image.';
      } else {
        this.extractMessage = 'No QR content detected. Please try another image.';
      }
    } catch {
      this.extractMessage = 'Could not read the image. Please retry.';
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.cameraSupported || !this.videoEl) {
      return;
    }

    this.stopCamera();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      const video = this.videoEl.nativeElement;
      video.srcObject = this.stream;
      await video.play();

      this.scanFrames();
    } catch {
      this.extractMessage = 'Camera access denied or unavailable on this device.';
    }
  }

  private stopCamera(): void {
    if (this.frameScanHandle) {
      cancelAnimationFrame(this.frameScanHandle);
      this.frameScanHandle = 0;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
    }
  }

  private scanFrames(): void {
    const loop = async () => {
      const video = this.videoEl?.nativeElement;
      if (!video || this.mode !== 'camera') {
        return;
      }

      const token = await this.readBarcodeFromSource(video);
      if (token) {
        this.form.patchValue({ token });
        this.extractMessage = 'QR content extracted from live camera.';
      }

      this.frameScanHandle = requestAnimationFrame(loop);
    };

    this.frameScanHandle = requestAnimationFrame(loop);
  }

  private async readBarcodeFromSource(source: CanvasImageSource): Promise<string | null> {
    const detector = this.createBarcodeDetector();

    if (!detector) {
      this.extractMessage =
        'Auto QR extraction is not supported in this browser. Paste token manually.';
      return null;
    }

    try {
      const codes = await detector.detect(source);
      const first = codes.find((code) => !!code.rawValue)?.rawValue;
      return first ? first.trim() : null;
    } catch {
      return null;
    }
  }

  private createBarcodeDetector(): BarcodeDetectorLike | null {
    const detectorCtor = (window as Window & { BarcodeDetector?: new (...args: any[]) => BarcodeDetectorLike })
      .BarcodeDetector;

    if (!detectorCtor) {
      return null;
    }

    return new detectorCtor({ formats: ['qr_code'] } as any);
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
}
