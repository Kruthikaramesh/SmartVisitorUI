import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { VisitorRequest } from '../../../shared/models/visitor-request.model';
import { RequestLog, AdminDashboardKpi } from '../../../shared/models/request-log.model';
import { RequestLogTableComponent } from '../../../shared/components/request-log-table/request-log-table.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RequestLogTableComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminDashboardService);
  private authService = inject(AuthService);

  kpi: AdminDashboardKpi | null = null;
  pendingRequests: VisitorRequest[] = [];
  requestLogs: RequestLog[] = [];
  loading = false;
  actionLoading: { [key: number]: boolean } = {};
  toast: { msg: string; ok: boolean } | null = null;

  currentUserId = Number(localStorage.getItem('userId') || '1');
  currentUserName = localStorage.getItem('fullName') || 'Unknown';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    // Load KPI
    this.adminService.getAdminKpi().subscribe({
      next: (kpi) => {
        this.kpi = kpi;
      },
      error: (err) => {
        console.error('Error loading KPI', err);
        this.showToast('Error loading KPI', false);
      }
    });

    // Load Pending Requests
    this.adminService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pending requests', err);
        this.showToast('Error loading pending requests', false);
        this.loading = false;
      }
    });

    // Load Request Logs
    this.adminService.requestLogs$.subscribe(
      logs => {
        this.requestLogs = logs;
      }
    );
  }

  // ── Approve Request ───────────────────────────────────────────────────────
  approveRequest(request: VisitorRequest): void {
    if (!confirm(`Approve request for ${request.visitorName}?`)) return;

    this.actionLoading[request.requestId] = true;
    this.adminService.approveRequest(request.requestId, this.currentUserId, 'Approved by admin').subscribe({
      next: () => {
        this.showToast(`Request for ${request.visitorName} approved!`, true);
        this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== request.requestId);
        this.loadDashboard();
        this.actionLoading[request.requestId] = false;
      },
      error: (err) => {
        console.error('Error approving request', err);
        this.showToast('Error approving request', false);
        this.actionLoading[request.requestId] = false;
      }
    });
  }

  // ── Reject Request ────────────────────────────────────────────────────────
  rejectRequest(request: VisitorRequest): void {
    const reason = prompt(`Enter rejection reason for ${request.visitorName}:`, '');
    if (reason === null) return;

    this.actionLoading[request.requestId] = true;
    this.adminService.rejectRequest(request.requestId, this.currentUserId, reason).subscribe({
      next: () => {
        this.showToast(`Request for ${request.visitorName} rejected`, true);
        this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== request.requestId);
        this.loadDashboard();
        this.actionLoading[request.requestId] = false;
      },
      error: (err) => {
        console.error('Error rejecting request', err);
        this.showToast('Error rejecting request', false);
        this.actionLoading[request.requestId] = false;
      }
    });
  }

  // ── Calculate Days Until Expiry ───────────────────────────────────────────
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

  // ── Show Toast Message ────────────────────────────────────────────────────
  private showToast(msg: string, ok: boolean): void {
    this.toast = { msg, ok };
    setTimeout(() => {
      this.toast = null;
    }, 3000);
  }
}
