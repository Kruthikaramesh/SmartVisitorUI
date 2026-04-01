import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DesignationApiService } from '../../../core/services/designation-api.service';
import { Designation } from '../../../shared/models/designation.model';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './designations.component.html',
  styleUrls: ['./designations.component.css']
})
export class DesignationsComponent implements OnInit {
  designations: Designation[] = [];
  filtered: Designation[] = [];
  loading = false;
  searchQuery = '';

  modalMode: ModalMode = null;
  selected: Designation | null = null;
  formLoading = false;
  formError = '';

  deleteTarget: Designation | null = null;
  deleteLoading = false;

  toast: { msg: string; ok: boolean } | null = null;
  private toastTimer: any;

  form!: FormGroup;
  readonly CURRENT_USER_ID = 1;

  constructor(
    private api: DesignationApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      designationName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]]
    });
    this.load();
  }

  private toArray(raw: any): Designation[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as Designation[];
    const candidates: any[] = [raw.data, raw.Data, raw.value, raw.Value];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as Designation[];
      if (c && Array.isArray(c.$values)) return c.$values as Designation[];
    }
    return [];
  }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getAll().subscribe({
      next: (raw: any) => {
        this.zone.run(() => {
          this.designations = this.toArray(raw);
          this.apply();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          console.error(err);
          this.notify('Failed to load designations', false);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearch(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    this.apply();
    this.cdr.detectChanges();
  }

  apply(): void {
    const q = this.searchQuery;
    this.filtered = q
      ? this.designations.filter((d: Designation) =>
        d.designationName?.toLowerCase().includes(q))
      : [...this.designations];
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.selected = null;
    this.formError = '';
    this.form.reset();
  }

  openEdit(d: Designation): void {
    this.modalMode = 'edit';
    this.selected = d;
    this.formError = '';
    this.form.patchValue({ designationName: d.designationName });
  }

  closeModal(): void {
    this.modalMode = null;
    this.selected = null;
    this.formError = '';
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.formLoading = true;
    this.formError = '';
    const val = this.form.value;

    if (this.modalMode === 'create') {
      this.api.create({
        designationName: val.designationName,
        createdBy: this.CURRENT_USER_ID
      }).subscribe({
        next: (created: any) => {
          this.zone.run(() => {
            if (created) this.designations.unshift(created as Designation);
            this.apply();
            this.closeModal();
            this.notify('Designation created!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          this.zone.run(() => {
            this.formError = this.extractError(err) || 'Failed to create designation.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });

    } else if (this.selected) {
      this.api.update(this.selected.designationId, {
        designationName: val.designationName,
        updatedBy: this.CURRENT_USER_ID
      }).subscribe({
        next: () => {
          this.zone.run(() => {
            const idx = this.designations.findIndex(
              (d: Designation) => d.designationId === this.selected!.designationId
            );
            if (idx > -1) this.designations[idx].designationName = val.designationName;
            this.apply();
            this.closeModal();
            this.notify('Designation updated!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          this.zone.run(() => {
            this.formError = this.extractError(err) || 'Failed to update designation.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  confirmDelete(d: Designation): void { this.deleteTarget = d; this.cdr.detectChanges(); }
  cancelDelete(): void { this.deleteTarget = null; this.cdr.detectChanges(); }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.api.delete(this.deleteTarget.designationId, this.CURRENT_USER_ID).subscribe({
      next: () => {
        this.zone.run(() => {
          this.designations = this.designations.filter(
            (d: Designation) => d.designationId !== this.deleteTarget!.designationId
          );
          this.apply();
          this.notify('Designation deleted', true);
          this.deleteTarget = null;
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.notify(this.extractError(err) || 'Failed to delete', false);
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private extractError(err: any): string {
    if (err?.error?.errors && Array.isArray(err.error.errors)) return err.error.errors.join(', ');
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return '';
  }

  notify(msg: string, ok: boolean): void {
    clearTimeout(this.toastTimer);
    this.toast = { msg, ok };
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => { this.toast = null; this.cdr.detectChanges(); }, 3500);
  }

  get f() { return this.form.controls; }

  activeCount(): number { return this.designations.filter((d: Designation) => !d.isDeleted).length; }
  deletedCount(): number { return this.designations.filter((d: Designation) => d.isDeleted).length; }
}
