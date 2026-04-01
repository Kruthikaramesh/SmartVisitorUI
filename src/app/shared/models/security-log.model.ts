// Security Verification Log - tracks all verification/scanning activities
export interface SecurityLog {
  logId: number;
  visitorName: string;
  token: string;
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'SCAN' | 'MANUAL_VERIFICATION';
  verificationStatus: 'APPROVED' | 'EXPIRED' | 'DENIED' | 'PENDING';
  verifiedBy: string; // Security staff name
  verifiedByUserId: number;
  verifiedAt: string; // timestamp
  remarks?: string;
  location?: string;
  scanMethod: 'QR_CODE' | 'MANUAL' | 'CAMERA';
}

// KPI metrics for Security Dashboard
export interface SecurityDashboardKpi {
  totalVisitors: number;
  totalApproved: number;
  totalExpired: number;
  totalDenied: number;
  checkInCount: number;
  checkOutCount: number;
  averageCheckInTime: string;
  todayVisitors: number;
}

// Activity summary by time
export interface ActivitySummary {
  date: string;
  checkIns: number;
  checkOuts: number;
  deniedAccess: number;
  expiredRequests: number;
}

// Filter options for security logs
export interface SecurityLogFilterOptions {
  status?: 'APPROVED' | 'EXPIRED' | 'DENIED' | 'PENDING';
  actionType?: 'CHECK_IN' | 'CHECK_OUT' | 'SCAN' | 'MANUAL_VERIFICATION';
  scanMethod?: 'QR_CODE' | 'MANUAL' | 'CAMERA';
  startDate?: string;
  endDate?: string;
  searchText?: string;
}
