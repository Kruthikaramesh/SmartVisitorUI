import { Routes } from '@angular/router';
import { WelcomePageComponent } from './features/welcome/pages/welcome-page/welcome-page.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './features/auth/pages/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';
import { LayoutComponent } from './core/layout/layout/layout.component';

export const routes: Routes = [
  // ── Public pages ───────────────────────────────────────────────────────────
  { path: '', component: WelcomePageComponent },
  { path: 'check-in', component: LoginComponent },
  { path: 'check-out', component: LoginComponent },
  { path: 'dashboard', redirectTo: 'visitors', pathMatch: 'full' },

  //// ── Auth flow ──────────────────────────────────────────────────────────────
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },
  { path: 'auth/verify-otp', component: VerifyOtpComponent },
  { path: 'auth/reset-password', component: ResetPasswordComponent },

  // ── Sidebar / Layout routes ────────────────────────────────────────────────
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'visitors',
        loadComponent: () =>
          import('./../app/core/pages/visitors/visitors.component').then(m => m.VisitorsComponent)
      },
      {
        path: 'visitorsrequest',
        loadComponent: () =>
          import('./../app/core/pages/visitorsrequest/visitorRequests.component')
            .then(m => m.VisitorRequestsComponent)
      },
      {
        path: 'verification',
        loadComponent: () =>
          import('./../app/core/pages/verification/verification.component')
            .then(m => m.VerificationComponent)
      },
      // Default redirect for the layout
      { path: '', redirectTo: 'visitors', pathMatch: 'full' }
    ]
  },

  // ── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
