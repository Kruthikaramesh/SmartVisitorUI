import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VisitorRequest, UpdateRequestStatusDto, GenerateQrCodeRequestDto } from '../../../shared/models/visitor-request.model';
import { VisitorRequestService } from '../../services/visitor-requests.service';

type ModalMode = 'status' | 'qr' | null;

@Component({
  selector: 'app-visitor-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visitorRequests.component.html',
  styleUrls: ['./visitorRequests.component.css']
})
export class VisitorRequestsComponent implements OnInit {

  requests: VisitorRequest[] = [];
  filtered: VisitorRequest[] = [];
  loading = false;
  searchQuery = '';

  modalMode: ModalMode = null;
  selected: VisitorRequest | null = null;
  formLoading = false;
  formError = '';

  deleteTarget: VisitorRequest | null = null;
  deleteLoading = false;

  qrLoading = false;
  qrImage: string | null = null;

  toast: { msg: string; ok: boolean } | null = null;
  private toastTimer: any;

  statusForm!: FormGroup;

  readonly CURRENT_USER_ID = 1;
  // Replace with: this.authService.currentUserId

  readonly STATUS_OPTIONS = [
    { id: 1, label: 'Pending', color: 'status--pending' },
    { id: 2, label: 'Approved', color: 'status--approved' },
    { id: 3, label: 'Rejected', color: 'status--rejected' },
    { id: 4, label: 'Expired', color: 'status--expired' },
  ];

  constructor(
    private requestService: VisitorRequestService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.statusForm = this.fb.group({
      statusId: [null, Validators.required],
      remarks: [''],
    });
    this.load();
  }

  // ── Helpers ──────────────────────────────────────────────────────
  private toArray(raw: any): VisitorRequest[] {
    if (!raw) return [];
    const candidates = [raw, raw.data, raw.Data, raw.result, raw.Result, raw.value, raw.Value];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (c && Array.isArray(c.$values)) return c.$values;
    }
    return [];
  }

  private toOne(raw: any): VisitorRequest | null {
    if (!raw) return null;
    const d = raw.data ?? raw.Data ?? raw;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return d.$values ? d.$values[0] : d;
    }
    return null;
  }

  // ── Load ──────────────────────────────────────────────────────────
  load() {
    this.loading = true;
    this.cdr.detectChanges();
    this.requestService.getAll().subscribe({
      next: raw => this.zone.run(() => {
        this.requests = this.toArray(raw);
        this.apply();
        this.loading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.notify('Failed to load requests', false);
        this.loading = false;
        this.cdr.detectChanges();
      })
    });
  }

  // ── Search ────────────────────────────────────────────────────────
  onSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    this.apply();
    this.cdr.detectChanges();
  }

  apply() {
    const q = this.searchQuery;
    this.filtered = q
      ? this.requests.filter(r =>
        r.visitorName?.toLowerCase().includes(q) ||
        r.requestedByName?.toLowerCase().includes(q) ||
        r.purpose?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q))
      : [...this.requests];
  }

  // ── Status Modal ──────────────────────────────────────────────────
  openStatus(r: VisitorRequest) {
    this.modalMode = 'status';
    this.selected = r;
    this.formError = '';
    this.statusForm.reset({ statusId: this.statusIdOf(r.status), remarks: '' });
  }

  submitStatus() {
    if (this.statusForm.invalid || !this.selected) { this.statusForm.markAllAsTouched(); return; }
    this.formLoading = true;
    this.formError = '';

    const dto: UpdateRequestStatusDto = {
      ...this.statusForm.value,
      actionBy: this.CURRENT_USER_ID
    };

    this.requestService.updateStatus(this.selected.requestId, dto).subscribe({
      next: raw => this.zone.run(() => {
        const updated = this.toOne(raw);
        if (updated) {
          const i = this.requests.findIndex(x => x.requestId === updated.requestId);
          if (i > -1) this.requests[i] = updated;
        } else if (this.selected) {
          // Optimistic update
          const option = this.STATUS_OPTIONS.find(s => s.id === dto.statusId);
          const i = this.requests.findIndex(x => x.requestId === this.selected!.requestId);
          if (i > -1 && option) this.requests[i] = { ...this.requests[i], status: option.label };
        }
        this.apply();
        this.closeModal();
        this.notify('Status updated!', true);
        this.formLoading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.formError = 'Failed to update status.';
        this.formLoading = false;
        this.cdr.detectChanges();
      })
    });
  }

  // ── QR Modal ──────────────────────────────────────────────────────
  openQR(r: VisitorRequest) {
    this.modalMode = 'qr';
    this.selected = r;
    this.qrImage = null;
    this.qrLoading = true;
    this.cdr.detectChanges();

    const dto: GenerateQrCodeRequestDto = {};
    this.requestService.generateQR(r.requestId, dto).subscribe({
      next: raw => this.zone.run(() => {
        this.qrImage = raw?.data?.qrCodeBase64 ?? raw?.qrCodeBase64 ?? raw?.data ?? null;
        this.qrLoading = false;
        this.cdr.detectChanges();
      }),
      error: () => this.zone.run(() => {
        this.notify('Failed to generate QR', false);
        this.qrLoading = false;
        this.closeModal();
        this.cdr.detectChanges();
      })
    });
  }

  // ── Delete ────────────────────────────────────────────────────────
  confirmDelete(r: VisitorRequest) { this.deleteTarget = r; this.cdr.detectChanges(); }
  cancelDelete() { this.deleteTarget = null; this.cdr.detectChanges(); }

  doDelete() {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.zone.run(() => {
      this.requests = this.requests.filter(r => r.requestId !== this.deleteTarget!.requestId);
      this.apply();
      this.notify('Request removed', true);
      this.deleteTarget = null;
      this.deleteLoading = false;
      this.cdr.detectChanges();
    });
  }

  closeModal() {
    this.modalMode = null;
    this.selected = null;
    this.formError = '';
    this.qrImage = null;
    this.statusForm.reset();
  }

  // ── Toast ──────────────────────────────────────────────────────────
  notify(msg: string, ok: boolean) {
    clearTimeout(this.toastTimer);
    this.toast = { msg, ok };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  // ── Utilities ──────────────────────────────────────────────────────
  get sf() { return this.statusForm.controls; }

  statusIdOf(label: string): number {
    return this.STATUS_OPTIONS.find(s => s.label.toLowerCase() === label?.toLowerCase())?.id ?? 1;
  }

  statusClass(status: string): string {
    return this.STATUS_OPTIONS.find(s => s.label.toLowerCase() === status?.toLowerCase())?.color ?? 'status--pending';
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  avatarBg(name: string): string {
    const palette = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#0f766e'];
    let h = 0;
    for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }

  countByStatus(label: string): number {
    return this.requests.filter(r => r.status?.toLowerCase() === label.toLowerCase()).length;
  }
}
