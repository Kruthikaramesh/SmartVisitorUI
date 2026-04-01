// User/Visitor Dashboard KPI
export interface UserDashboardKpi {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  activeRequests: number; // currently valid
}

// User's request detail view
export interface UserRequestDetail {
  requestId: number;
  visitorName: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  validFrom: string;
  validTill: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedByName?: string;
  rejectionReason?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;
  qrCode?: string; // base64 or URL to QR code image
}

// User visit logs (check-in/check-out records)
export interface UserVisitLog {
  logId: number;
  visitorName: string;
  checkInTime: string;
  checkOutTime?: string;
  purpose: string;
  notes?: string;
  duration?: string; // calculated duration
  requestId: number;
}

// Filter options for user logs
export interface UserLogFilterOptions {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
}
