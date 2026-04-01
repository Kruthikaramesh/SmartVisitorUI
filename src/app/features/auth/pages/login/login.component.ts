import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  showPassword = false;
  visitorAction = '';

  // FIX: show a success banner when redirected here after password reset
  resetSuccess = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.visitorAction =
      this.route.snapshot.queryParamMap.get('action')
      ?? this.route.snapshot.routeConfig?.path
      ?? '';

    // Show success banner if redirected after password reset
    this.resetSuccess = this.route.snapshot.queryParamMap.get('reset') === 'success';
  }

  get f() { return this.loginForm.controls; }

  get isFormFilled(): boolean {
    return !!(this.f['email']?.value?.trim() && this.f['password']?.value?.trim());
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.resetSuccess = false;

    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        const role = (localStorage.getItem('role') || '').trim().toLowerCase();
        const isAdmin = role === 'admin';
        const isSecurity = role === 'security' || role === 'security guard';

        const target = this.visitorAction === 'check-out'
          ? ['/verification']
          : isAdmin
            ? ['/dashboard/admin']
            : isSecurity
              ? ['/dashboard/security']
              : ['/dashboard/user'];

        this.router.navigate(target);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.submitted = false;
        this.errorMessage = err?.error?.message || 'Invalid email or password';
        setTimeout(() => (this.submitted = true), 10);
      }
    });
  }

  // FIX: navigates to dedicated page instead of showing an inline form
  onForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
