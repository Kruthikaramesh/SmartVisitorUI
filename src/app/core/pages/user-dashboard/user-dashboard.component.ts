import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDashboardService } from '../../../core/services/user-dashboard.service';
import { VisitorRequest } from '../../../shared/models/visitor-request.model';
import { UserDashboardKpi } from '../../../shared/models/user-dashboard.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  private userService = inject(UserDashboardService);

  kpi: UserDashboardKpi | null = null;
  requests: VisitorRequest[] = [];
  loading = false;
  selectedTab: 'requests' = 'requests';
  toast: { msg: string; ok: boolean } | null = null;
  today = new Date();

  currentUserId = Number(localStorage.getItem('userId') || '1');
  currentUserName = localStorage.getItem('fullName') || 'User';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    this.userService.getUserKpi(this.currentUserId).subscribe({
      next: kpi => { this.kpi = kpi; },
      error: () => this.showToast('Failed to load stats', false)
    });

    this.userService.getUserRequests(this.currentUserId).subscribe({
      next: reqs => { this.requests = reqs; this.loading = false; },
      error: () => { this.showToast('Failed to load requests', false); this.loading = false; }
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  switchTab(tab: 'requests'): void {
    this.selectedTab = tab;
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  getActiveRequests(): VisitorRequest[] {
    return this.requests.filter(r =>
      new Date(r.validTill) > new Date() && r.status?.toLowerCase() === 'approved'
    );
  }

  getDaysUntilExpiry(validTill: string): number {
    return Math.ceil((new Date(validTill).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      approved: 'status--approved',
      pending: 'status--pending',
      rejected: 'status--rejected',
      expired: 'status--expired'
    };
    return map[status?.toLowerCase()] ?? 'status--pending';
  }

  // ── Avatar helpers ────────────────────────────────────────────────────────
  initials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  avatarBg(name: string): string {
    const palette = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#0f766e'];
    let h = 0;
    for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  private showToast(msg: string, ok: boolean): void {
    this.toast = { msg, ok };
    setTimeout(() => { this.toast = null; }, 3000);
  }
}
