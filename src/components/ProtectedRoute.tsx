import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.initializing) {
    return <div className="route-loading">Verificando sesión segura de Nicabliss...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
