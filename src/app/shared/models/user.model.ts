export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  roleName?: string;
  designationId: number;
  designationName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  roleId: number;
  designationId: number;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  roleId?: number;
  designationId?: number;
  updatedBy: number;
  isActive?: boolean;
}
