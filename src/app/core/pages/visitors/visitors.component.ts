import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Visitor } from '../../../shared/models/visitor.model';
import { VisitorRequestService } from '../../services/visitor-requests.service';
import { CreateVisitorRequestDto } from '../../../shared/models/visitor-request.model';
import { environment } from '../../../../environment/environment';

type ModalMode = 'create' | 'edit' | 'request' | null;

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visitors.component.html',
  styleUrls: ['./visitors.component.css']
})
export class VisitorsComponent implements OnInit {
  visitors: Visitor[] = [];
  filtered: Visitor[] = [];
  loading = false;
  searchQuery = '';

  modalMode: ModalMode = null;
  selected: Visitor | null = null;
  formLoading = false;
  formError = '';

  deleteTarget: Visitor | null = null;
  deleteLoading = false;

  toast: { msg: string; ok: boolean } | null = null;
  private toastTimer: any;

  form!: FormGroup;
  requestForm!: FormGroup;

  readonly CURRENT_USER_ID = 1;
  // const CURRENT_USER_ID = this.authService.currentUserId;
  private readonly API = `${environment.apiUrl}/api/visitors`;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private requestService: VisitorRequestService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      visitorName: ['', [Validators.required, Validators.maxLength(100)]],
      phoneNumber: ['', Validators.maxLength(20)],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      companyName: ['', Validators.maxLength(150)]
    });

    this.requestForm = this.fb.group({
      // visitorId is set programmatically from selected visitor — not a form field
      requestedBy: [this.CURRENT_USER_ID, Validators.required],
      purpose: ['', [Validators.required, Validators.maxLength(300)]],
      validFrom: ['', Validators.required],
      validTill: ['', Validators.required],
    });

    this.load();
  }

  // ── Helpers ─────────────────────────────────────────────────────
  private toArray(raw: any): Visitor[] {
    if (!raw) return [];
    const candidates = [raw, raw.data, raw.Data, raw.result, raw.Result, raw.value, raw.Value];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (c && Array.isArray(c.$values)) return c.$values;
    }
    return [];
  }

  private toOne(raw: any): Visitor | null {
    if (!raw) return null;
    const d = raw.data ?? raw.Data ?? raw;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return d.$values ? d.$values[0] : d;
    }
    return null;
  }

  // ── Load ─────────────────────────────────────────────────────────
  load() {
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.API}/by-id/${this.CURRENT_USER_ID}`).subscribe({
      next: raw => {
        this.zone.run(() => {
          const visitor = this.toOne(raw);
          this.visitors = visitor ? [visitor] : [];
          this.apply();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {
        this.zone.run(() => {
          console.error('API error:', err);
          this.notify('Failed to load visitor', false);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Search ───────────────────────────────────────────────────────
  onSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    this.apply();
    this.cdr.detectChanges();
  }

  apply() {
    const q = this.searchQuery;
    this.filtered = q
      ? this.visitors.filter(v =>
        v.visitorName?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.companyName?.toLowerCase().includes(q) ||
        v.phoneNumber?.includes(q))
      : [...this.visitors];
  }

  // ── Visitor CRUD modals ──────────────────────────────────────────
  openCreate() {
    this.modalMode = 'create';
    this.selected = null;
    this.formError = '';
    this.form.reset();
  }

  openEdit(v: Visitor) {
    this.modalMode = 'edit';
    this.selected = v;
    this.formError = '';
    this.form.patchValue({
      visitorName: v.visitorName,
      phoneNumber: v.phoneNumber ?? '',
      email: v.email ?? '',
      companyName: v.companyName ?? ''
    });
  }

  closeModal() {
    this.modalMode = null;
    this.selected = null;
    this.formError = '';
    this.form.reset();
    this.requestForm.reset({ requestedBy: this.CURRENT_USER_ID });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formLoading = true;
    this.formError = '';
    const val = this.form.value;

    if (this.modalMode === 'create') {
      this.http.post<any>(this.API, { ...val, createdBy: this.CURRENT_USER_ID }).subscribe({
        next: raw => {
          this.zone.run(() => {
            const c = this.toOne(raw);
            if (c) this.visitors.unshift(c);
            this.apply();
            this.closeModal();
            this.notify('Visitor created!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.formError = 'Failed to create visitor.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else if (this.selected) {
      this.http.put<any>(`${this.API}/${this.selected.visitorId}`, { ...val, updatedBy: this.CURRENT_USER_ID }).subscribe({
        next: raw => {
          this.zone.run(() => {
            const u = this.toOne(raw);
            if (u) {
              const i = this.visitors.findIndex(x => x.visitorId === u.visitorId);
              if (i > -1) this.visitors[i] = u;
            }
            this.apply();
            this.closeModal();
            this.notify('Visitor updated!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.formError = 'Failed to update visitor.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  // ── Create Request Modal ─────────────────────────────────────────
  openRequest(v: Visitor) {
    this.modalMode = 'request';
    this.selected = v;
    this.formError = '';
    this.requestForm.reset({ requestedBy: this.CURRENT_USER_ID, purpose: '', validFrom: '', validTill: '' });
  }

  submitRequest() {
    if (this.requestForm.invalid || !this.selected) { this.requestForm.markAllAsTouched(); return; }
    this.formLoading = true;
    this.formError = '';

    const dto: CreateVisitorRequestDto = {
      visitorId: this.selected.visitorId,
      requestedBy: this.requestForm.value.requestedBy,
      purpose: this.requestForm.value.purpose,
      validFrom: this.requestForm.value.validFrom,
      validTill: this.requestForm.value.validTill,
      createdBy: this.CURRENT_USER_ID
    };

    this.requestService.create(dto).subscribe({
      next: () => {
        this.zone.run(() => {
          this.closeModal();
          this.notify('Visitor request created!', true);
          this.formLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.formError = 'Failed to create request.';
          this.formLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Delete ───────────────────────────────────────────────────────
  confirmDelete(v: Visitor) { this.deleteTarget = v; this.cdr.detectChanges(); }
  cancelDelete() { this.deleteTarget = null; this.cdr.detectChanges(); }

  doDelete() {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.http.delete<any>(`${this.API}/${this.deleteTarget.visitorId}`).subscribe({
      next: () => {
        this.zone.run(() => {
          this.visitors = this.visitors.filter(v => v.visitorId !== this.deleteTarget!.visitorId);
          this.apply();
          this.notify('Visitor deleted', true);
          this.deleteTarget = null;
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.notify('Failed to delete', false);
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Toast ────────────────────────────────────────────────────────
  notify(msg: string, ok: boolean) {
    clearTimeout(this.toastTimer);
    this.toast = { msg, ok };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  get f() { return this.form.controls; }
  get rf() { return this.requestForm.controls; }

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

  uniqueCompanies(): number {
    return new Set(this.visitors.map(v => v.companyName).filter(Boolean)).size;
  }

  withEmail(): number {
    return this.visitors.filter(v => v.email).length;
  }
}
