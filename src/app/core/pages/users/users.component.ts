import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserApiService } from '../../../core/services/user-api.service';
import { DesignationApiService } from '../../../core/services/designation-api.service';
import { User } from '../../../shared/models/user.model';
import { Designation } from '../../../shared/models/designation.model';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filtered: User[] = [];
  designations: Designation[] = [];
  loading = false;
  searchQuery = '';

  modalMode: ModalMode = null;
  selected: User | null = null;
  formLoading = false;
  formError = '';
  showPassword = false;

  deleteTarget: User | null = null;
  deleteLoading = false;

  toast: { msg: string; ok: boolean } | null = null;
  private toastTimer: any;

  form!: FormGroup;
  readonly CURRENT_USER_ID = 1;

  roles = [
    { roleId: 1, roleName: 'Admin' },
    { roleId: 2, roleName: 'Employee' },
    { roleId: 3, roleName: 'Security Guard' }
  ];

  constructor(
    private userApi: UserApiService,
    private designationApi: DesignationApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      email: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]{2,}\.com$/)]],
      password: ['', [Validators.required, Validators.maxLength(255)]],
      phoneNumber: ['', [Validators.pattern(/^[6789]\d{9}$/)]],
      roleId: [null, [Validators.required, Validators.min(1)]],
      designationId: [null, [Validators.required, Validators.min(1)]]
    });
    this.loadDesignations();
    this.load();
  }

  private toArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    const candidates: any[] = [raw.data, raw.Data, raw.value, raw.Value];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
      if (c && Array.isArray(c.$values)) return c.$values;
    }
    return [];
  }

  private toOne(raw: any): any {
    if (!raw) return null;
    const d = raw.data ?? raw.Data ?? raw;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      return d.$values ? d.$values[0] : d;
    }
    return null;
  }

  loadDesignations(): void {
    this.designationApi.getAll().subscribe({
      next: (raw: any) => {
        this.zone.run(() => {
          const arr = this.toArray(raw) as Designation[];
          this.designations = arr.filter((d: Designation) => !d.isDeleted);
          this.cdr.detectChanges();
        });
      },
      error: () => { }
    });
  }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.userApi.getAll().subscribe({
      next: (raw: any) => {
        this.zone.run(() => {
          this.users = this.toArray(raw) as User[];
          this.apply();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          console.error(err);
          this.notify('Failed to load users', false);
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
      ? this.users.filter((u: User) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.roleName?.toLowerCase().includes(q) ||
        u.designationName?.toLowerCase().includes(q))
      : [...this.users];
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.selected = null;
    this.formError = '';
    this.showPassword = false;
    this.form.reset();
    this.form.get('password')!.setValidators([Validators.required, Validators.maxLength(255)]);
    this.form.get('password')!.updateValueAndValidity();
  }

  openEdit(u: User): void {
    this.modalMode = 'edit';
    this.selected = u;
    this.formError = '';
    this.showPassword = false;
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.form.patchValue({
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber ?? '',
      roleId: u.roleId,
      designationId: u.designationId,
      password: ''
    });
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
      this.userApi.create({
        fullName: val.fullName,
        email: val.email,
        password: val.password,
        phoneNumber: val.phoneNumber || undefined,
        roleId: +val.roleId,
        designationId: +val.designationId
      }).subscribe({
        next: (user: any) => {
          this.zone.run(() => {
            const created = this.toOne(user) ?? user;
            if (created) this.users.unshift(created as User);
            this.apply();
            this.closeModal();
            this.notify('User created successfully!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          this.zone.run(() => {
            this.formError = this.extractError(err) || 'Failed to create user.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });

    } else if (this.selected) {
      const updateDto: any = { updatedBy: this.CURRENT_USER_ID };
      if (val.fullName) updateDto.fullName = val.fullName;
      if (val.email) updateDto.email = val.email;
      if (val.phoneNumber) updateDto.phoneNumber = val.phoneNumber;
      if (val.roleId) updateDto.roleId = +val.roleId;
      if (val.designationId) updateDto.designationId = +val.designationId;

      this.userApi.update(this.selected.userId, updateDto).subscribe({
        next: () => {
          this.zone.run(() => {
            this.load();
            this.closeModal();
            this.notify('User updated successfully!', true);
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          this.zone.run(() => {
            this.formError = this.extractError(err) || 'Failed to update user.';
            this.formLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  confirmDelete(u: User): void { this.deleteTarget = u; this.cdr.detectChanges(); }
  cancelDelete(): void { this.deleteTarget = null; this.cdr.detectChanges(); }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.userApi.delete(this.deleteTarget.userId, this.CURRENT_USER_ID).subscribe({
      next: () => {
        this.zone.run(() => {
          this.users = this.users.filter((u: User) => u.userId !== this.deleteTarget!.userId);
          this.apply();
          this.notify('User deleted', true);
          this.deleteTarget = null;
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.notify(this.extractError(err) || 'Failed to delete user', false);
          this.deleteLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleStatus(u: User): void {
    this.userApi.update(u.userId, { updatedBy: this.CURRENT_USER_ID, isActive: !u.isActive }).subscribe({
      next: () => {
        this.zone.run(() => {
          u.isActive = !u.isActive;
          this.notify(`User ${u.isActive ? 'activated' : 'deactivated'}`, true);
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.notify(this.extractError(err) || 'Failed to update status', false);
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

  initials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  avatarBg(name: string): string {
    const p = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#0f766e'];
    let h = 0;
    for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
    return p[Math.abs(h) % p.length];
  }

  activeCount(): number { return this.users.filter((u: User) => u.isActive).length; }
  inactiveCount(): number { return this.users.filter((u: User) => !u.isActive).length; }
}
