import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type UserRole = 'Admin' | 'Employee' | 'Security Guard';

@Injectable({ providedIn: 'root' })
export class RoleGuardService {
  constructor(private router: Router, private authService: AuthService) { }

  private normalizeRole(role: string | null | undefined): UserRole | null {
    const value = (role || '').trim().toLowerCase();
    if (!value) return null;
    if (value === 'admin') return 'Admin';
    if (value === 'employee' || value === 'user' || value === 'receptionist') return 'Employee';
    if (value === 'security' || value === 'security guard') return 'Security Guard';
    return role as UserRole;
  }

  private navigateToRoleHome(userRole: string | null | undefined): void {
    switch (this.normalizeRole(userRole)) {
      case 'Admin':
        this.router.navigate(['/dashboard/admin']);
        break;
      case 'Employee':
        this.router.navigate(['/dashboard/user']);
        break;
      case 'Security Guard':
        this.router.navigate(['/dashboard/security']);
        break;
      default:
        this.router.navigate(['/auth/login']);
        break;
    }
  }

  canActivate(allowedRoles: UserRole[]): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const userRole = localStorage.getItem('role')?.trim();
    const normalizedRole = this.normalizeRole(userRole);
    const normalizedAllowed = allowedRoles.map(r => this.normalizeRole(r) || r);

    if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
      this.navigateToRoleHome(userRole);
      return false;
    }

    return true;
  }
}

/**
 * Role-based route guard function
 * Usage: { path: 'admin', component: AdminComponent, canActivate: [roleGuard('Admin')] }
 */
export const roleGuard = (allowedRoles: UserRole | UserRole[]): CanActivateFn => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const normalizeRole = (role: string | null | undefined): UserRole | null => {
    const value = (role || '').trim().toLowerCase();
    if (!value) return null;
    if (value === 'admin') return 'Admin';
    if (value === 'employee' || value === 'user' || value === 'receptionist') return 'Employee';
    if (value === 'security' || value === 'security guard') return 'Security Guard';
    return role as UserRole;
  };

  const fallbackRoute = (role: string | null | undefined): string[] => {
    switch (normalizeRole(role)) {
      case 'Admin':
        return ['/dashboard/admin'];
      case 'Employee':
        return ['/dashboard/user'];
      case 'Security Guard':
        return ['/dashboard/security'];
      default:
        return ['/auth/login'];
    }
  };

  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const router = new Router();
    const authService = new AuthService(null as any);

    if (!authService.isLoggedIn()) {
      router.navigate(['/auth/login']);
      return false;
    }

    const userRole = localStorage.getItem('role')?.trim();
    const normalizedRole = normalizeRole(userRole);
    const normalizedAllowed = roles.map(r => normalizeRole(r) || r);

    if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
      console.warn(`Access denied. User role '${userRole}' is not in allowed roles: ${roles.join(', ')}`);
      router.navigate(fallbackRoute(userRole));
      return false;
    }

    return true;
  };
};

/**
 * Simpler role guard using service injection
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard {
  constructor(private roleGuard: RoleGuardService, private router: Router, private authService: AuthService) { }

  canActivate(): boolean {
    return this.roleGuard.canActivate(['Admin']);
  }
}

@Injectable({ providedIn: 'root' })
export class SecurityGuard {
  constructor(private roleGuard: RoleGuardService, private router: Router, private authService: AuthService) { }

  canActivate(): boolean {
    return this.roleGuard.canActivate(['Security Guard']);
  }
}


@Injectable({ providedIn: 'root' })
export class UserGuard {
  constructor(private roleGuard: RoleGuardService, private router: Router, private authService: AuthService) { }

  canActivate(): boolean {
    return this.roleGuard.canActivate(['Employee']);
  }
}

@Injectable({ providedIn: 'root' })
export class AdminOrUserGuard {
  constructor(private roleGuard: RoleGuardService, private router: Router, private authService: AuthService) { }

  canActivate(): boolean {
    return this.roleGuard.canActivate(['Admin', 'Employee']);
  }
}
