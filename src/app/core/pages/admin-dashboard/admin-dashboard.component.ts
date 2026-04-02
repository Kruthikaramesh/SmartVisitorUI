import { Component, OnInit, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { VisitorRequest } from '../../../shared/models/visitor-request.model';
import { RequestLog, AdminDashboardKpi } from '../../../shared/models/request-log.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminDashboardService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  kpi: AdminDashboardKpi | null = null;
  recentRequests: VisitorRequest[] = [];
  requestLogs: RequestLog[] = [];
  loading = false;

  currentUserName = localStorage.getItem('fullName') || 'Admin';
  today = new Date();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cdr.detectChanges();

    // Load KPI
    this.adminService.getAdminKpi().subscribe({
      next: (kpi: AdminDashboardKpi) => {
        this.zone.run(() => {
          this.kpi = kpi;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error('KPI error', err)
    });

    // Load recent requests (all, for the activity feed — read-only)
    this.adminService.getAllRequests().subscribe({
      next: (requests: VisitorRequest[]) => {
        this.zone.run(() => {
          // Show only the 8 most recent
          this.recentRequests = requests
            .sort((a, b) => new Date(b.requestedAt ?? b.validFrom).getTime() - new Date(a.requestedAt ?? a.validFrom).getTime())
            .slice(0, 8);
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          console.error('Requests error', err);
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });

    // Load logs
    this.adminService.requestLogs$.subscribe((logs: RequestLog[]) => {
      this.zone.run(() => {
        this.requestLogs = logs.slice(0, 6);
        this.cdr.detectChanges();
      });
    });
  }

  statusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'expired': return 'status-expired';
      default: return 'status-pending';
    }
  }

  getDaysUntilExpiry(validTill: string): number {
    return Math.ceil((new Date(validTill).getTime() - Date.now()) / 86400000);
  }

  approvalRateSegment(): number {
    if (!this.kpi || this.kpi.totalRequests === 0) return 0;
    return Math.round((this.kpi.approvedRequests / this.kpi.totalRequests) * 251);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  greetingTime(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
