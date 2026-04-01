import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private readonly logsSubject = new BehaviorSubject<ScanLog[]>([
    {
      id: 901,
      token: 'SV-ALPHA-77',
      visitorName: 'Riya Verma',
      source: 'camera',
      status: 'approved',
      scannedAt: '2026-03-29T08:15:00.000Z',
      remarks: 'Board room meeting',
      scannedBy: 'Gate A Security'
    },
    {
      id: 902,
      token: 'SV-BETA-98',
      visitorName: 'Aman Khan',
      source: 'token',
      status: 'expired',
      scannedAt: '2026-03-29T09:02:00.000Z',
      remarks: 'Late arrival',
      scannedBy: 'Gate A Security'
    },
    {
      id: 903,
      token: 'SV-GAMMA-52',
      visitorName: 'Priya Singh',
      source: 'upload',
      status: 'denied',
      scannedAt: '2026-03-29T10:47:00.000Z',
      remarks: 'Token mismatch',
      scannedBy: 'Gate B Security'
    },
    {
      id: 904,
      token: 'SV-DELTA-12',
      visitorName: 'Nikhil Rao',
      source: 'camera',
      status: 'approved',
      scannedAt: '2026-03-29T11:21:00.000Z',
      remarks: 'Confirmed by host',
      scannedBy: 'Gate A Security'
    }
  ]);

  getLogs(): Observable<ScanLog[]> {
    return this.logsSubject.asObservable();
  }

  getKpis(): Observable<SecurityKpi> {
    return new Observable<SecurityKpi>((subscriber) => {
      const emitKpis = () => {
        const logs = this.logsSubject.value;
        const kpis: SecurityKpi = {
          totalVisitors: logs.length,
          totalApproved: logs.filter((log) => log.status === 'approved').length,
          totalExpired: logs.filter((log) => log.status === 'expired').length,
          totalDenied: logs.filter((log) => log.status === 'denied').length
        };

        subscriber.next(kpis);
      };

      emitKpis();
      const sub = this.logsSubject.subscribe(() => emitKpis());

      return () => sub.unsubscribe();
    });
  }

  verifyToken(payload: string, remarks: string, source: ScanLog['source']): VerificationResult {
    const normalizedPayload = payload.trim().toUpperCase();
    const now = new Date().toISOString();

    let status: VerificationResult['status'] = 'approved';
    let title = 'Secure Verification';
    let details = 'Token signature, request state, and host approval are valid.';
    let checkinMessage = 'Instant check-in completed. Visitor may proceed.';

    if (!normalizedPayload.startsWith('SV-')) {
      status = 'denied';
      details = 'Token is not recognized in SmartVisitor format.';
      checkinMessage = 'Check-in blocked. Please request a fresh token.';
    } else if (normalizedPayload.includes('EXP') || normalizedPayload.includes('BETA')) {
      status = 'expired';
      details = 'Token was valid earlier but has crossed its validity window.';
      checkinMessage = 'Visitor requires host re-approval for entry.';
    }

    const newLog: ScanLog = {
      id: this.logsSubject.value.length + 901,
      token: normalizedPayload,
      visitorName: status === 'approved' ? 'Verified Visitor' : 'Unknown Visitor',
      source,
      status,
      scannedAt: now,
      remarks: remarks?.trim() || undefined,
      scannedBy: 'Gate A Security'
    };

    this.logsSubject.next([newLog, ...this.logsSubject.value]);

    return {
      status,
      title,
      details,
      checkinMessage,
      token: normalizedPayload
    };
  }
}
