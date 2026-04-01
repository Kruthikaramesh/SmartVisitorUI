import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import {
  UserDashboardKpi,
  UserRequestDetail,
  UserVisitLog,
  UserLogFilterOptions
} from '../../shared/models/user-dashboard.model';
import { VisitorRequest } from '../../shared/models/visitor-request.model';
import { ApiResult } from '../../shared/models/api-result.model';

@Injectable({
  providedIn: 'root'
})
export class UserDashboardService {
  private readonly requestApi = `${environment.apiUrl}/api/visitorrequests`;
  private readonly visitorApi = `${environment.apiUrl}/api/visitors`;
  private readonly visitLogsApi = `${environment.apiUrl}/api/visit-logs`;

  constructor(private http: HttpClient) { }

  // ── Get User's Requests (by userId/visitorId) ────────────────────────────
  getUserRequests(userId: number): Observable<VisitorRequest[]> {
    return this.http.get<ApiResult<VisitorRequest[]>>(`${this.requestApi}?userId=${userId}`).pipe(
      map(res => this.extractData(res))
    );
  }

  // ── Get User's Request with Details ───────────────────────────────────────
  getUserRequestDetail(requestId: number): Observable<UserRequestDetail> {
    return this.http.get<ApiResult<VisitorRequest>>(`${this.requestApi}/${requestId}`).pipe(
      map(res => {
        const req = this.extractData(res);
        return this.mapToUserRequestDetail(req);
      })
    );
  }

  // ── Get User's Visit Logs ─────────────────────────────────────────────────
  getUserVisitLogs(userId: number, filter?: UserLogFilterOptions): Observable<UserVisitLog[]> {
    let params = `?userId=${userId}`;
    if (filter) {
      if (filter.status) params += `&status=${filter.status}`;
      if (filter.startDate) params += `&startDate=${filter.startDate}`;
      if (filter.endDate) params += `&endDate=${filter.endDate}`;
    }
    return this.http.get<ApiResult<any[]>>(`${this.visitLogsApi}${params}`).pipe(
      map(res => {
        const logs = this.extractData(res);
        return logs.map(log => this.mapToUserVisitLog(log));
      })
    );
  }

  // ── Get User Dashboard KPI ────────────────────────────────────────────────
  getUserKpi(userId: number): Observable<UserDashboardKpi> {
    return this.getUserRequests(userId).pipe(
      map(requests => this.calculateUserKpi(requests))
    );
  }

  // ── Get Active Requests (currently valid) ─────────────────────────────────
  getActiveRequests(userId: number): Observable<VisitorRequest[]> {
    return this.getUserRequests(userId).pipe(
      map(requests => requests.filter(r => {
        const validTill = new Date(r.validTill);
        return validTill > new Date() && r.status?.toLowerCase() === 'approved';
      }))
    );
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private extractData<T>(res: ApiResult<T>): T {
    if (!res || !res.data) return [] as any;
    if (Array.isArray(res.data)) return res.data as T;
    if (res.data && Array.isArray((res.data as any).$values)) return (res.data as any).$values as T;
    return res.data as T;
  }

  private mapToUserRequestDetail(request: VisitorRequest): UserRequestDetail {
    const validTill = new Date(request.validTill);
    const today = new Date();
    const isExpired = validTill < today;
    const daysUntilExpiry = Math.ceil((validTill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      requestId: request.requestId,
      visitorName: request.visitorName,
      purpose: request.purpose,
      status: request.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
      validFrom: request.validFrom,
      validTill: request.validTill,
      requestedAt: request.requestedAt,
      approvedAt: request.approvedAt,
      approvedByName: request.approvedByName,
      isExpired,
      daysUntilExpiry: Math.max(daysUntilExpiry, -1)
    };
  }

  private mapToUserVisitLog(log: any): UserVisitLog {
    const checkInTime = new Date(log.checkInTime);
    const checkOutTime = log.checkOutTime ? new Date(log.checkOutTime) : null;
    let duration = '';

    if (checkOutTime) {
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${minutes}m`;
    }

    return {
      logId: log.logId || log.id,
      visitorName: log.visitorName,
      checkInTime: log.checkInTime,
      checkOutTime: log.checkOutTime,
      purpose: log.purpose,
      notes: log.remarks || log.notes,
      duration,
      requestId: log.requestId
    };
  }

  private calculateUserKpi(requests: VisitorRequest[]): UserDashboardKpi {
    const total = requests.length;
    const approved = requests.filter(r => r.status?.toLowerCase() === 'approved').length;
    const pending = requests.filter(r => r.status?.toLowerCase() === 'pending').length;
    const rejected = requests.filter(r => r.status?.toLowerCase() === 'rejected').length;
    const expired = requests.filter(r => r.status?.toLowerCase() === 'expired').length;
    const active = requests.filter(r => {
      const validTill = new Date(r.validTill);
      return validTill > new Date() && r.status?.toLowerCase() === 'approved';
    }).length;

    return {
      totalRequests: total,
      approvedRequests: approved,
      pendingRequests: pending,
      rejectedRequests: rejected,
      expiredRequests: expired,
      activeRequests: active
    };
  }
}
