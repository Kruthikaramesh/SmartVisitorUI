import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Place at: src/app/core/guards/auth.guard.ts
// Usage in app.routes.ts:
//   { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
