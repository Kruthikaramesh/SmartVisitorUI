import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'app/core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {

  form!: FormGroup;
  email = '';
  loading = false;
  resending = false;
  errorMsg = '';
  resendMsg = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';

    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  get otp() { return this.form.get('otp'); }

  get isReady(): boolean {
    return this.form.valid && !this.loading;
  }

  // Mask email for display: a***@domain.com
  get maskedEmail(): string {
    const [local, domain] = this.email.split('@');
    if (!domain) return this.email;
    return local[0] + '***@' + domain;
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) return;

    this.loading = true;
    const otpValue = this.otp?.value;

    this.auth.verifyOtp({ email: this.email, otp: otpValue }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email: this.email, otp: otpValue }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  resendCode(): void {
    this.resendMsg = '';
    this.errorMsg = '';
    this.resending = true;

    this.auth.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.resending = false;
        this.resendMsg = 'A new code has been sent to your email.';
        this.form.reset();
      },
      error: () => {
        this.resending = false;
        this.errorMsg = 'Could not resend code. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
