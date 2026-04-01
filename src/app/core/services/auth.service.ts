import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiry: string;
  userId: number;
  fullName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  // ── Login ────────────────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        if (res.refreshToken) {
          localStorage.setItem('refreshToken', res.refreshToken);
        }
        localStorage.setItem('userId', res.userId.toString());
        localStorage.setItem('fullName', res.fullName);
        localStorage.setItem('role', res.role);
      })
    );
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  logout() {
    // Keep token until the request is sent so the interceptor can attach it.
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => localStorage.clear())
    );
  }

  // ── Forgot password — step 1: request OTP ────────────────────────────────
  // FIX: was missing baseUrl and had inconsistent signature
  forgotPassword(dto: { email: string }) {
    return this.http.post(`${this.baseUrl}/forgot-password`, dto);
  }

  // ── Forgot password — step 2: verify OTP ─────────────────────────────────
  verifyOtp(dto: { email: string; otp: string }) {
    return this.http.post(`${this.baseUrl}/verify-otp`, dto);
  }

  // ── Forgot password — step 3: reset password ─────────────────────────────
  resetPassword(dto: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.http.post(`${this.baseUrl}/reset-password`, dto);
  }

  // ── Change password (logged-in user) ─────────────────────────────────────
  changePassword(dto: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.http.post(`${this.baseUrl}/change-password`, dto);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
