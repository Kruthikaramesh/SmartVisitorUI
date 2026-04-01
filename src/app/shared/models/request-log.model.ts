// Request Log - tracks admin actions on visitor requests
export interface RequestLog {
  logId: number;
  requestId: number;
  visitorName: string;
  actionType: 'APPROVE' | 'REJECT' | 'EXPIRE' | 'CREATE';
  actionBy: string; // Admin name
  actionByUserId: number;
  actionAt: string; // timestamp
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  remarks?: string;
  validFrom: string;
  validTill: string;
  isExpired: boolean;
}

// KPI metrics for Admin Dashboard
export interface AdminDashboardKpi {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
  approvalRate: number; // percentage
}

// Detailed request with approval tracking
export interface RequestWithApprovalTracking extends VisitorRequest {
  isExpired: boolean;
  daysUntilExpiry: number;
  approvalHistory?: RequestLog[];
}

export interface VisitorRequest {
  requestId: number;
  visitorName: string;
  requestedByName: string;
  purpose: string;
  status: string;
  validFrom: string;
  validTill: string;
  requestedAt: string;
  approvedAt?: string;
  approvedByName?: string;
}

// Filter options for logs
export interface LogFilterOptions {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  actionType?: 'APPROVE' | 'REJECT' | 'EXPIRE' | 'CREATE';
  startDate?: string;
  endDate?: string;
  searchText?: string;
}
