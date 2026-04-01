import { Routes } from '@angular/router';
import { WelcomePageComponent } from './features/welcome/pages/welcome-page/welcome-page.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './features/auth/pages/verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';
import { LayoutComponent } from './core/layout/layout/layout.component';
import { AdminGuard, SecurityGuard, UserGuard, AdminOrUserGuard } from './core/guards/role.guard';

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
      // ── Dashboards ────────────────────────────────────────────────────────
      {
        path: 'dashboard/admin',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./core/pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'dashboard/user',
        canActivate: [UserGuard],
        loadComponent: () =>
          import('./core/pages/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent)
      },
      {
        path: 'dashboard/security',
        canActivate: [SecurityGuard],
        loadComponent: () =>
          import('./features/security/pages/security-dashboard/security-dashboard.component').then(m => m.SecurityDashboardComponent)
      },

      // ── Content Pages ─────────────────────────────────────────────────────
      {
        path: 'visitors',
        canActivate: [AdminOrUserGuard],
        loadComponent: () =>
          import('./../app/core/pages/visitors/visitors.component').then(m => m.VisitorsComponent)
      },
      {
        path: 'visitorsrequest',
        canActivate: [AdminOrUserGuard],
        loadComponent: () =>
          import('./../app/core/pages/visitorsrequest/visitorRequests.component')
            .then(m => m.VisitorRequestsComponent)
      },
      {
        path: 'users',
        canActivate: [AdminGuard],
        loadComponent: () => import('./core/pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'designations',
        loadComponent: () => import('./core/pages/designations/designations.component').then(m => m.DesignationsComponent)
      },
      {
        path: 'verification',
        canActivate: [SecurityGuard],
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
