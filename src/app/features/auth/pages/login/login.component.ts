import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

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

  // ✅ Forgot / Reset password
  showResetPassword = false;
  resetEmail = '';
  resetMessage = '';

  visitorAction = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Read query param (check-in / check-out)
    this.visitorAction = this.route.snapshot.queryParamMap.get('action') ?? '';
  }

  // ✅ Initialize form
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // ✅ Form controls getter
  get f() {
    return this.loginForm.controls;
  }

  // ✅ Enable button only if fields are filled
  get isFormFilled(): boolean {
    const email = this.f['email'].value?.trim();
    const password = this.f['password'].value?.trim();
    return !!(email && password);
  }

  // ✅ Toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ✅ Forgot password toggle
  onForgotPassword(): void {
    this.showResetPassword = !this.showResetPassword;
    this.resetMessage = '';
  }

  // ✅ Reset password
  onResetPassword(): void {
    if (!this.resetEmail) {
      this.resetMessage = 'Please enter your email';
      return;
    }

    setTimeout(() => {
      this.resetMessage = 'Reset link sent to your email (demo)';
    }, 1000);
  }

  // ✅ Submit login
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const { email, password } = this.loginForm.value;

    // 🔥 Simulated API call
    setTimeout(() => {

      this.loading = false;

      if (email === 'admin@smartvisitor.com' && password === 'admin') {

        switch (this.visitorAction) {
          case 'check-out':
            this.router.navigate(['/check-out']);
            break;

          case 'check-in':
          default:
            this.router.navigate(['/']);
            break;
        }

      } else {
        this.errorMessage = 'Invalid email or password. Please try again.';

        this.submitted = false;

        setTimeout(() => {
          this.submitted = true;
        }, 10);
      }

    }, 1000);
  }
}
