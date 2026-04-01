import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import {
  RequestLog,
  AdminDashboardKpi,
  RequestWithApprovalTracking,
  LogFilterOptions
} from '../../shared/models/request-log.model';
import { VisitorRequest, UpdateRequestStatusDto } from '../../shared/models/visitor-request.model';
import { ApiResult } from '../../shared/models/api-result.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly requestApi = `${environment.apiUrl}/api/visitorrequests`;
  private readonly logsApi = `${environment.apiUrl}/api/request-logs`;

  private requestLogsSubject = new BehaviorSubject<RequestLog[]>([]);
  public requestLogs$ = this.requestLogsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadRequestLogs();
  }

  // ── Get Pending Requests ──────────────────────────────────────────────────
  getPendingRequests(): Observable<VisitorRequest[]> {
    return this.http.get<ApiResult<VisitorRequest[]>>(`${this.requestApi}?status=pending`).pipe(
      map(res => this.extractData(res))
    );
  }

  // ── Get All Requests ──────────────────────────────────────────────────────
  getAllRequests(): Observable<VisitorRequest[]> {
    return this.http.get<ApiResult<VisitorRequest[]>>(this.requestApi).pipe(
      map(res => this.extractData(res))
    );
  }

  // ── Get All Requests with Approval Tracking ──────────────────────────────
  getRequestsWithTracking(): Observable<RequestWithApprovalTracking[]> {
    return this.getAllRequests().pipe(
      map(requests => requests.map(req => this.addApprovalTracking(req)))
    );
  }

  // ── Approve Request ───────────────────────────────────────────────────────
  approveRequest(requestId: number, approvedByUserId: number, remarks?: string): Observable<any> {
    const dto: UpdateRequestStatusDto = {
      statusId: 2, // Approved
      actionBy: approvedByUserId,
      remarks: remarks
    };
    return this.http.put(`${this.requestApi}/${requestId}/status`, dto).pipe(
      map(() => {
        this.logRequestAction('APPROVE', requestId, approvedByUserId, 'APPROVED', remarks);
        return true;
      })
    );
  }

  // ── Reject Request ────────────────────────────────────────────────────────
  rejectRequest(requestId: number, rejectedByUserId: number, reason?: string): Observable<any> {
    const dto: UpdateRequestStatusDto = {
      statusId: 3, // Rejected
      actionBy: rejectedByUserId,
      remarks: reason
    };
    return this.http.put(`${this.requestApi}/${requestId}/status`, dto).pipe(
      map(() => {
        this.logRequestAction('REJECT', requestId, rejectedByUserId, 'REJECTED', reason);
        return true;
      })
    );
  }

  // ── Get Request Logs ──────────────────────────────────────────────────────
  getRequestLogs(filter?: LogFilterOptions): Observable<RequestLog[]> {
    let params = '';
    if (filter) {
      const queryParts = [];
      if (filter.status) queryParts.push(`status=${filter.status}`);
      if (filter.actionType) queryParts.push(`actionType=${filter.actionType}`);
      if (filter.startDate) queryParts.push(`startDate=${filter.startDate}`);
      if (filter.endDate) queryParts.push(`endDate=${filter.endDate}`);
      if (filter.searchText) queryParts.push(`search=${filter.searchText}`);
      params = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    }
    return this.http.get<ApiResult<RequestLog[]>>(`${this.logsApi}${params}`).pipe(
      map(res => this.extractData(res)),
      catchError(() => of([]))
    );
  }

  // ── Get Admin Dashboard KPI ───────────────────────────────────────────────
  getAdminKpi(): Observable<AdminDashboardKpi> {
    return this.getAllRequests().pipe(
      map(requests => this.calculateAdminKpi(requests))
    );
  }

  // ── Load Request Logs ─────────────────────────────────────────────────────
  private loadRequestLogs(): void {
    this.getRequestLogs().subscribe(
      logs => this.requestLogsSubject.next(logs)
    );
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private extractData<T>(res: ApiResult<T>): T {
    if (!res || !res.data) return [] as any;
    if (Array.isArray(res.data)) return res.data as T;
    if (res.data && Array.isArray((res.data as any).$values)) return (res.data as any).$values as T;
    return res.data as T;
  }

  private addApprovalTracking(request: VisitorRequest): RequestWithApprovalTracking {
    const validTill = new Date(request.validTill);
    const today = new Date();
    const isExpired = validTill < today;
    const daysUntilExpiry = Math.ceil((validTill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...request,
      isExpired,
      daysUntilExpiry: Math.max(daysUntilExpiry, -1)
    };
  }

  private calculateAdminKpi(requests: VisitorRequest[]): AdminDashboardKpi {
    const total = requests.length;
    const pending = requests.filter(r => r.status?.toLowerCase() === 'pending').length;
    const approved = requests.filter(r => r.status?.toLowerCase() === 'approved').length;
    const rejected = requests.filter(r => r.status?.toLowerCase() === 'rejected').length;
    const expired = requests.filter(r => r.status?.toLowerCase() === 'expired').length;

    return {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      expiredRequests: expired,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  }

  private logRequestAction(
    actionType: 'APPROVE' | 'REJECT' | 'EXPIRE' | 'CREATE',
    requestId: number,
    actionByUserId: number,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
    remarks?: string
  ): void {
    // This would typically call a backend API to log the action
    // For now, we'll just update the local logs
    console.log('Logging request action:', { actionType, requestId, actionByUserId, status, remarks });
  }
}
