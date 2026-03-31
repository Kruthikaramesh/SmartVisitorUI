import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'app/core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() { return this.form.get('email'); }

  get isReady(): boolean {
    return this.form.valid && !this.loading;
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) return;

    this.loading = true;
    const email = this.email?.value.trim();

    // FIX: was passing bare string — must pass { email } object
    this.auth.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Failed to send reset code. Try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
