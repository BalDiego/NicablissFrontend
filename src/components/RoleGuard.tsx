import { Navigate, Outlet } from "react-router-dom";
import { hasAnyRole } from "../auth/permissions";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../services/types";

export default function RoleGuard({ allowedRoles }: { allowedRoles: readonly UserRole[] }) {
  const { user } = useAuth();

  if (!user || !hasAnyRole(user.role, allowedRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
