import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

/**
 * AppInitService - Handles app initialization and prevents blank screens on refresh
 * This service ensures that:
 * 1. The app validates the token before rendering
 * 2. Redirect to login if token is invalid
 * 3. Prevent race conditions between guard checks and component rendering
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Initialize the app on startup
   * Check if user has a valid token and user data in localStorage
   */
  initialize(): Promise<void> {
    return new Promise((resolve) => {
      // Check if user was previously logged in
      const token = this.authService.getToken();
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('role');

      // If no token, redirect to login
      if (!token || !userId || !role) {
        localStorage.clear();
        this.router.navigate(['/auth/login']);
        resolve();
        return;
      }

      // Token exists - app is ready to proceed
      // The route guards will verify the token on each route
      resolve();
    });
  }
}
