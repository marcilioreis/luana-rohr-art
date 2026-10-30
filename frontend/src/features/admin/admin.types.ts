export interface AdminRoleRef {
  roleId: number;
  roleName: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role?: string | null;
  createdAt?: string;
  roles?: AdminRoleRef[];
}

export interface AdminPermission {
  id: number;
  code: string;
  description?: string | null;
}

export interface AdminRolePermission {
  permissionId: number;
  code: string;
  description?: string | null;
}

export interface AdminRole {
  id: number;
  name: string;
  description?: string | null;
  permissions?: AdminRolePermission[];
}
