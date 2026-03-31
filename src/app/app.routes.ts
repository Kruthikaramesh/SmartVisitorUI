import { Routes } from '@angular/router';
import { WelcomePageComponent } from './features/welcome/pages/welcome-page/welcome-page.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './features/auth/pages/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';

// FIX: Removed the conflicting lazy-loaded AuthModule route.
// All auth pages are standalone components — no NgModule needed.
// The old setup had BOTH eager imports AND a lazy-loaded AuthModule,
// which caused duplicate route registration.

export const routes: Routes = [
  // ── Public pages ───────────────────────────────────────────────────────────
  { path: '', component: WelcomePageComponent },
  { path: 'check-in', component: LoginComponent },
  { path: 'check-out', component: LoginComponent },

  // ── Auth flow ──────────────────────────────────────────────────────────────
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },
  { path: 'auth/verify-otp', component: VerifyOtpComponent },
  { path: 'auth/reset-password', component: ResetPasswordComponent },

  // ── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
