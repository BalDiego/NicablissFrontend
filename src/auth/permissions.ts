import type { UserRole } from "../services/types";

export type Permission =
  | "dashboard:view"
  | "customers:manage"
  | "billing:manage"
  | "services:manage"
  | "cash:manage"
  | "users:manage";

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "customers:manage",
    "billing:manage",
    "services:manage",
    "cash:manage",
    "users:manage",
  ],
  RECEPTIONIST: [
    "dashboard:view",
    "customers:manage",
    "billing:manage",
    "services:manage",
    "cash:manage",
  ],
  STAFF: ["dashboard:view", "services:manage"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function hasAnyRole(role: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(role);
}
