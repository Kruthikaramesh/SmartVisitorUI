import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Functional interceptor (Angular 15+) — no class/NgModule needed.
// Place at: src/app/core/interceptors/auth.interceptor.ts

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip attaching a token to the auth endpoints themselves
  const isAuthEndpoint = req.url.includes('/api/auth/login')
    || req.url.includes('/api/auth/refresh')
    || req.url.includes('/api/auth/forgot-password')
    || req.url.includes('/api/auth/verify-otp')
    || req.url.includes('/api/auth/reset-password');

  const token = authService.getToken();

  // Clone request with Authorization header if we have a token
  const authReq = (token && !isAuthEndpoint)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 on a protected route → clear storage and redirect to login
      if (err.status === 401 && !isAuthEndpoint) {
        localStorage.clear();
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};
