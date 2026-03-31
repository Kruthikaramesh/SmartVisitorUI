import { Routes } from '@angular/router';
import { WelcomePageComponent } from './features/welcome/pages/welcome-page/welcome-page.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { SecurityShellComponent } from './features/security/components/security-shell.component';
import { SecurityDashboardComponent } from './features/security/pages/security-dashboard/security-dashboard.component';
import { SecurityQrScannerComponent } from './features/security/pages/security-qr-scanner/security-qr-scanner.component';

export const routes: Routes = [
  { path: '', component: WelcomePageComponent },
  { path: 'check-in', component: LoginComponent },
  { path: 'check-out', component: LoginComponent },
  {
    path: 'security',
    component: SecurityShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SecurityDashboardComponent },
      { path: 'qr-scanner', component: SecurityQrScannerComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
