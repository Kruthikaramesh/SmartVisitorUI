import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import {
  SecurityLog,
  SecurityDashboardKpi,
  ActivitySummary,
  SecurityLogFilterOptions
} from '../../../shared/models/security-log.model';
import { ApiResult } from '../../../shared/models/api-result.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityDashboardEnhancedService {
  private readonly scanApi = `${environment.apiUrl}/api/scan`;
  private readonly visitLogsApi = `${environment.apiUrl}/api/visit-logs`;
  private readonly securityLogsApi = `${environment.apiUrl}/api/security-logs`;

  private securityLogsSubject = new BehaviorSubject<SecurityLog[]>([]);
  public securityLogs$ = this.securityLogsSubject.asObservable();

  private kpiSubject = new BehaviorSubject<SecurityDashboardKpi | null>(null);
  public kpi$ = this.kpiSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSecurityLogs();
    this.loadKpi();
  }

  // ── Get Security Logs ─────────────────────────────────────────────────────
  getSecurityLogs(filter?: SecurityLogFilterOptions): Observable<SecurityLog[]> {
    let params = '';
    if (filter) {
      const queryParts = [];
      if (filter.status) queryParts.push(`status=${filter.status}`);
      if (filter.actionType) queryParts.push(`actionType=${filter.actionType}`);
      if (filter.scanMethod) queryParts.push(`scanMethod=${filter.scanMethod}`);
      if (filter.startDate) queryParts.push(`startDate=${filter.startDate}`);
      if (filter.endDate) queryParts.push(`endDate=${filter.endDate}`);
      if (filter.searchText) queryParts.push(`search=${filter.searchText}`);
      params = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    }
    return this.http.get<ApiResult<SecurityLog[]>>(`${this.securityLogsApi}${params}`).pipe(
      map(res => this.extractData(res))
    );
  }

  // ── Get All Visit Logs ────────────────────────────────────────────────────
  getVisitLogs(): Observable<SecurityLog[]> {
    return this.http.get<ApiResult<any[]>>(this.visitLogsApi).pipe(
      map(res => {
        const logs = this.extractData(res);
        return logs.map(log => this.mapToSecurityLog(log));
      })
    );
  }

  // ── Get Security KPI ──────────────────────────────────────────────────────
  getSecurityKpi(): Observable<SecurityDashboardKpi> {
    return this.getVisitLogs().pipe(
      map(logs => this.calculateSecurityKpi(logs))
    );
  }

  // ── Get Activity Summary (by date) ────────────────────────────────────────
  getActivitySummary(startDate?: string, endDate?: string): Observable<ActivitySummary[]> {
    let params = '';
    if (startDate || endDate) {
      const queryParts = [];
      if (startDate) queryParts.push(`startDate=${startDate}`);
      if (endDate) queryParts.push(`endDate=${endDate}`);
      params = '?' + queryParts.join('&');
    }
    return this.http.get<ApiResult<ActivitySummary[]>>(`${this.securityLogsApi}/activity${params}`).pipe(
      map(res => this.extractData(res))
    );
  }

  // ── Get Today's Statistics ────────────────────────────────────────────────
  getTodayStats(): Observable<SecurityDashboardKpi> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSecurityLogs({
      startDate: today,
      endDate: today
    }).pipe(
      map(logs => this.calculateSecurityKpi(logs))
    );
  }

  // ── Log Verification Event ────────────────────────────────────────────────
  logVerification(log: Omit<SecurityLog, 'logId'>): Observable<SecurityLog> {
    return this.http.post<ApiResult<SecurityLog>>(`${this.securityLogsApi}`, log).pipe(
      map(res => this.extractData(res)),
      map(log => {
        this.loadSecurityLogs(); // Refresh logs
        this.loadKpi(); // Refresh KPI
        return log;
      })
    );
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private loadSecurityLogs(): void {
    this.getSecurityLogs().subscribe(
      logs => this.securityLogsSubject.next(logs)
    );
  }

  private loadKpi(): void {
    this.getSecurityKpi().subscribe(
      kpi => this.kpiSubject.next(kpi)
    );
  }

  private extractData<T>(res: ApiResult<T>): T {
    if (!res || !res.data) return [] as any;
    if (Array.isArray(res.data)) return res.data as T;
    if (res.data && Array.isArray((res.data as any).$values)) return (res.data as any).$values as T;
    return res.data as T;
  }

  private mapToSecurityLog(log: any): SecurityLog {
    return {
      logId: log.logId || log.id,
      visitorName: log.visitorName,
      token: log.token,
      actionType: (log.actionType || 'SCAN') as 'CHECK_IN' | 'CHECK_OUT' | 'SCAN' | 'MANUAL_VERIFICATION',
      verificationStatus: (log.status || 'PENDING') as 'APPROVED' | 'EXPIRED' | 'DENIED' | 'PENDING',
      verifiedBy: log.verifiedBy || log.scannedBy || 'System',
      verifiedByUserId: log.verifiedByUserId || 1,
      verifiedAt: log.verifiedAt || log.scannedAt,
      remarks: log.remarks,
      location: log.location,
      scanMethod: (log.scanMethod || 'QR_CODE') as 'QR_CODE' | 'MANUAL' | 'CAMERA'
    };
  }

  private calculateSecurityKpi(logs: SecurityLog[]): SecurityDashboardKpi {
    const totalVisitors = new Set(logs.map(l => l.visitorName)).size;
    const approved = logs.filter(l => l.verificationStatus === 'APPROVED').length;
    const expired = logs.filter(l => l.verificationStatus === 'EXPIRED').length;
    const denied = logs.filter(l => l.verificationStatus === 'DENIED').length;
    const checkIns = logs.filter(l => l.actionType === 'CHECK_IN').length;
    const checkOuts = logs.filter(l => l.actionType === 'CHECK_OUT').length;
    const todayVisitors = new Set(
      logs
        .filter(l => new Date(l.verifiedAt).toDateString() === new Date().toDateString())
        .map(l => l.visitorName)
    ).size;

    return {
      totalVisitors,
      totalApproved: approved,
      totalExpired: expired,
      totalDenied: denied,
      checkInCount: checkIns,
      checkOutCount: checkOuts,
      averageCheckInTime: this.calculateAverageTime(logs),
      todayVisitors
    };
  }

  private calculateAverageTime(logs: SecurityLog[]): string {
    if (logs.length === 0) return '0m';

    const durations: number[] = [];
    const visitorCheckIns = new Map<string, SecurityLog>();

    // Group check-ins by visitor
    logs
      .filter(l => l.actionType === 'CHECK_IN')
      .forEach(log => {
        if (!visitorCheckIns.has(log.visitorName)) {
          visitorCheckIns.set(log.visitorName, log);
        }
      });

    // Calculate duration between check-in and check-out
    logs
      .filter(l => l.actionType === 'CHECK_OUT')
      .forEach(checkOut => {
        const checkIn = visitorCheckIns.get(checkOut.visitorName);
        if (checkIn) {
          const duration = new Date(checkOut.verifiedAt).getTime() - new Date(checkIn.verifiedAt).getTime();
          durations.push(duration);
        }
      });

    if (durations.length === 0) return '0m';

    const avgMs = durations.reduce((a, b) => a + b) / durations.length;
    const hours = Math.floor(avgMs / (1000 * 60 * 60));
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
