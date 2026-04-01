import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDashboardService } from '../../../core/services/user-dashboard.service';
import { VisitorRequest } from '../../../shared/models/visitor-request.model';
import { UserDashboardKpi, UserRequestDetail, UserVisitLog } from '../../../shared/models/user-dashboard.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  private userService = inject(UserDashboardService);

  kpi: UserDashboardKpi | null = null;
  requests: VisitorRequest[] = [];
  visitLogs: UserVisitLog[] = [];
  loading = false;
  selectedTab: 'overview' | 'requests' | 'visits' = 'overview';
  toast: { msg: string; ok: boolean } | null = null;

  currentUserId = Number(localStorage.getItem('userId') || '1');
  currentUserName = localStorage.getItem('fullName') || 'Unknown';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    // Load KPI
    this.userService.getUserKpi(this.currentUserId).subscribe({
      next: (kpi) => {
        this.kpi = kpi;
      },
      error: (err) => {
        console.error('Error loading KPI', err);
        this.showToast('Error loading KPI', false);
      }
    });

    // Load User Requests
    this.userService.getUserRequests(this.currentUserId).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests', err);
        this.showToast('Error loading requests', false);
        this.loading = false;
      }
    });

    // Load Visit Logs
    this.userService.getUserVisitLogs(this.currentUserId).subscribe({
      next: (logs) => {
        this.visitLogs = logs;
      },
      error: (err) => {
        console.error('Error loading visit logs', err);
      }
    });
  }

  // ── Get Request Status Badge Class ────────────────────────────────────────
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'approved': 'status-approved',
      'pending': 'status-pending',
      'rejected': 'status-rejected',
      'expired': 'status-expired'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
  }

  // ── Check if Request is Expired ───────────────────────────────────────────
  isExpired(validTill: string): boolean {
    return new Date(validTill) < new Date();
  }

  // ── Get Days Until Expiry ─────────────────────────────────────────────────
  getDaysUntilExpiry(validTill: string): number {
    const expiry = new Date(validTill);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Format Date ───────────────────────────────────────────────────────────
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ── Get Active Requests ───────────────────────────────────────────────────
  getActiveRequests(): VisitorRequest[] {
    return this.requests.filter(r => {
      const validTill = new Date(r.validTill);
      return validTill > new Date() && r.status?.toLowerCase() === 'approved';
    });
  }

  // ── Switch Tab ────────────────────────────────────────────────────────────
  switchTab(tab: 'overview' | 'requests' | 'visits'): void {
    this.selectedTab = tab;
  }

  // ── Show Toast Message ────────────────────────────────────────────────────
  private showToast(msg: string, ok: boolean): void {
    this.toast = { msg, ok };
    setTimeout(() => {
      this.toast = null;
    }, 3000);
  }
}
