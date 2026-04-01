export interface Visitor {
  visitorId: number;
  visitorName: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
}

export interface CreateVisitorDto {
  visitorName: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  createdBy: number;
}

export interface UpdateVisitorDto {
  visitorName: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  updatedBy: number;
}
