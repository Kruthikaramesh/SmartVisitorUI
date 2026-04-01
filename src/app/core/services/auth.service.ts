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

  private unwrap<T = any>(raw: any): T {
    if (!raw) return raw as T;
    return (raw.data ?? raw.Data ?? raw.result ?? raw.Result ?? raw.value ?? raw.Value ?? raw) as T;
  }

  private read<T = any>(obj: any, camel: string, pascal: string): T | undefined {
    return (obj?.[camel] ?? obj?.[pascal]) as T | undefined;
  }

  // ── Login ────────────────────────────────────────────────────────────────
  login(email: string, password: string) {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(raw => {
        const res = this.unwrap<any>(raw);

        const token = this.read<string>(res, 'token', 'Token');
        const refreshToken = this.read<string>(res, 'refreshToken', 'RefreshToken');
        const userId = this.read<number>(res, 'userId', 'UserId');
        const fullName = this.read<string>(res, 'fullName', 'FullName');
        const role = this.read<string>(res, 'role', 'Role');

        if (!token) {
          throw new Error('Login response missing token.');
        }

        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        if (typeof userId === 'number' && !Number.isNaN(userId)) {
          localStorage.setItem('userId', userId.toString());
        }
        if (fullName) {
          localStorage.setItem('fullName', fullName);
        }
        if (role) {
          localStorage.setItem('role', role.trim());
        }
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
    const token = this.getToken();
    if (!token) return false;
    const normalized = token.trim().toLowerCase();
    return normalized !== 'undefined' && normalized !== 'null' && normalized.length > 0;
  }
}
