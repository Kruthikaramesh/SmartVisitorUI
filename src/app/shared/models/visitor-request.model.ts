export interface VisitorRequest {
  requestId: number;
  requestedById: number;
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

export interface CreateVisitorRequestDto {
  visitorId: number;
  requestedBy: number;
  purpose: string;
  validFrom: string;
  validTill: string;
  createdBy: number;
}

export interface UpdateRequestStatusDto {
  statusId: number; // 1=Pending, 2=Approved, 3=Rejected, 4=Expired
  actionBy: number;
  remarks?: string;
}

export interface GenerateQrCodeRequestDto {
  generatedBy: number;
  regenerateIfExists?: boolean;
}
