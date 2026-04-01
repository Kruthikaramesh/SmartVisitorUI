import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  isUserMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onToggle() { this.toggleSidebar.emit(); }

  get fullName(): string {
    return (localStorage.getItem('fullName') || 'User').trim() || 'User';
  }

  get shortName(): string {
    const parts = this.fullName.split(/\s+/).filter(Boolean);
    return (parts[0] || 'U').slice(0, 2).toUpperCase();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.navigateToLogin(),
      error: () => this.navigateToLogin()
    });
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  private navigateToLogin(): void {
    localStorage.clear();
    this.isUserMenuOpen = false;
    this.router.navigate(['/auth/login']);
  }
}
