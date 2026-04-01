import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
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

  readonly kpis$ = this.securityService.getKpis();
  readonly logs$ = this.securityService.getLogs();

  readonly kpiCards$ = this.kpis$.pipe(
    map((kpi: SecurityKpi) => [
      {
        label: 'Total Visitors',
        value: kpi.totalVisitors,
        tone: 'tone-a'
      },
      {
        label: 'Total Approved',
        value: kpi.totalApproved,
        tone: 'tone-b'
      },
      {
        label: 'Expired',
        value: kpi.totalExpired,
        tone: 'tone-c'
      },
      {
        label: 'Denied',
        value: kpi.totalDenied,
        tone: 'tone-d'
      }
    ])
  );

  trackByLogId(index: number, log: ScanLog): number {
    return log.id;
  }
}
