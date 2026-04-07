import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, map, startWith, switchMap } from 'rxjs';
import {
  ScanLog,
  SecurityDashboardService,
  SecurityKpi
} from '../../services/security-dashboard.service';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.css']
})
export class SecurityDashboardComponent {
  private readonly securityService = inject(SecurityDashboardService);

  readonly logs$ = interval(5000).pipe(
    startWith(0),
    switchMap(() => this.securityService.getLogs())
  );

  readonly kpis$ = this.logs$.pipe(
    map((logs: ScanLog[]): SecurityKpi => ({
      totalVisitors: logs.length,
      totalApproved: logs.filter((log) => log.status === 'approved').length,
      totalExpired: logs.filter((log) => log.status === 'expired').length,
      totalDenied: logs.filter((log) => log.status === 'denied').length
    }))
  );

  readonly kpiCards$ = this.kpis$.pipe(
    map((kpi: SecurityKpi) => [
      {
        label: 'Total Visitors',
        value: kpi.totalVisitors,
        icon: 'users',
        color: 'indigo'
      },
      {
        label: 'Total Approved',
        value: kpi.totalApproved,
        icon: 'check',
        color: 'teal'
      },
      {
        label: 'Expired',
        value: kpi.totalExpired,
        icon: 'clock',
        color: 'violet'
      },
      {
        label: 'Denied',
        value: kpi.totalDenied,
        icon: 'x',
        color: 'rose'
      }
    ])
  );

  trackByLogId(index: number, log: ScanLog): number {
    return log.id;
  }
}
