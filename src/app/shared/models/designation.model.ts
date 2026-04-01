export interface Designation {
  designationId: number;
  designationName: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy?: number;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
}

export interface CreateDesignationDto {
  designationName: string;
  createdBy?: number;
}

export interface UpdateDesignationDto {
  designationName: string;
  isActive?: boolean;
  updatedBy?: number;
}
