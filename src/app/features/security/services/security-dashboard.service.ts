import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environment/environment';
import { ApiResult } from '../../../shared/models/api-result.model';

export interface SecurityKpi {
  totalVisitors: number;
  totalApproved: number;
  totalExpired: number;
  totalDenied: number;
}

export interface ScanLog {
  id: number;
  token: string;
  visitorName: string;
  source: 'token' | 'camera' | 'upload';
  status: 'approved' | 'expired' | 'denied';
  scannedAt: string;
  remarks?: string;
  scannedBy: string;
}

export interface VerificationResult {
  status: 'approved' | 'expired' | 'denied';
  title: string;
  details: string;
  checkinMessage: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityDashboardService {
  private readonly currentUserId = 1;
  private readonly scanApi = `${environment.apiUrl}/api/scan`;
  private readonly visitLogsApi = `${environment.apiUrl}/api/visit-logs`;

  constructor(private http: HttpClient) { }

  getLogs(): Observable<ScanLog[]> {
    return this.http.get<ApiResult<VisitLogApiDto[]>>(this.visitLogsApi).pipe(
      map(res => (res?.data ?? []).map(log => this.mapVisitLog(log)))
    );
  }

  getKpis(): Observable<SecurityKpi> {
    return this.getLogs().pipe(
      map(logs => ({
        totalVisitors: logs.length,
        totalApproved: logs.filter((log) => log.status === 'approved').length,
        totalExpired: logs.filter((log) => log.status === 'expired').length,
        totalDenied: logs.filter((log) => log.status === 'denied').length
      }))
    );
  }

  verifyToken(payload: string, remarks: string, source: ScanLog['source']): Observable<VerificationResult> {
    const normalizedPayload = payload.trim();

    return this.http.post<ApiResult<ScanValidationResponseDto>>(`${this.scanApi}/validate`, {
      qrPayload: normalizedPayload,
      scannedBy: this.currentUserId,
      remarks
    }).pipe(
      map(res => {
        const result = res?.data;
        const status = this.mapDecisionToStatus(result?.decision, result?.message);
        const title = status === 'approved' ? 'Secure Verification' : 'Access Review Required';
        const checkinMessage = status === 'approved'
          ? 'Instant check-in completed. Visitor may proceed.'
          : 'Check-in blocked. Please contact the host or admin.';

        return {
          status,
          title,
          details: result?.message ?? 'No response message from server.',
          checkinMessage,
          token: normalizedPayload,
          source
        } as VerificationResult;
      })
    );
  }

  private mapVisitLog(log: VisitLogApiDto): ScanLog {
    const status = this.mapScanResultToStatus(log.scanResult);
    return {
      id: log.logId,
      token: `REQ-${log.requestId ?? 'NA'}`,
      visitorName: log.visitorName ?? 'Unknown Visitor',
      source: 'token',
      status,
      scannedAt: log.scannedAt,
      remarks: log.remarks ?? undefined,
      scannedBy: log.scannedByName ?? `User ${log.scannedBy}`
    };
  }

  private mapScanResultToStatus(scanResult: string): ScanLog['status'] {
    const normalized = (scanResult || '').toLowerCase();
    if (normalized.includes('expired')) return 'expired';
    if (normalized.includes('allowed') || normalized.includes('approved')) return 'approved';
    return 'denied';
  }

  private mapDecisionToStatus(decision?: string, message?: string): VerificationResult['status'] {
    const d = (decision || '').toLowerCase();
    const m = (message || '').toLowerCase();
    if (d === 'allowed') return 'approved';
    if (m.includes('expired') || m.includes('not active yet')) return 'expired';
    return 'denied';
  }
}

interface VisitLogApiDto {
  logId: number;
  requestId?: number;
  scannedBy: number;
  scannedByName?: string;
  scanResult: string;
  remarks?: string;
  scannedAt: string;
  visitorId?: number;
  visitorName?: string;
}

interface ScanValidationResponseDto {
  isAllowed: boolean;
  decision: string;
  message: string;
  requestId?: number;
  visitorId?: number;
  visitorName?: string;
  scannedAt: string;
  visitLogId: number;
}
