import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  form!: FormGroup;
  email = '';
  otp = '';

  loading = false;
  errorMsg = '';
  showNewPwd = false;
  showConfirmPwd = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.otp = this.route.snapshot.queryParamMap.get('otp') ?? '';

    // Guard: if no email/otp, restart the flow
    if (!this.email || !this.otp) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  // Custom cross-field validator
  private passwordsMatch(group: FormGroup) {
    const pw = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pw === confirm ? null : { mismatch: true };
  }

  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  get isReady(): boolean {
    return this.form.valid && !this.loading;
  }

  get maskedEmail(): string {
    const [local, domain] = this.email.split('@');
    if (!domain) return this.email;
    return local[0] + '***@' + domain;
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) return;

    this.loading = true;

    this.auth.resetPassword({
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword?.value,
      confirmPassword: this.confirmPassword?.value
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/login'], {
          queryParams: { reset: 'success' }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Reset failed. The code may have expired.';
      }
    });
  }
}
