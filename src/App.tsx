import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import Dashboard from "./Dashboard";
import CuentasCobros from "./CuentasCobros";
import PedidosAlimentos from "./PedidosAlimentos";
import Lavanderia from "./Lavanderia";
import CajaCierres from "./CajaCierres";
import UsuariosRoles from "./UsuariosRoles";
import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import NotFoundPage from "./pages/NotFoundPage";
import CustomersPage from "./features/customers/CustomersPage";
import CustomerDetailPage from "./features/customers/CustomerDetailPage";
import ReservationsPage from "./features/reservations/ReservationsPage";
import ReservationForm from "./features/reservations/ReservationForm";
import ReservationDetailPage from "./features/reservations/ReservationDetailPage";
import "./App.css";
import "./Login.css";

const managementRoles = ["ADMIN", "RECEPTIONIST"] as const;
const serviceRoles = ["ADMIN", "RECEPTIONIST", "STAFF"] as const;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route element={<RoleGuard allowedRoles={managementRoles} />}>
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="reservations/new" element={<ReservationForm />} />
            <Route path="reservations/:id" element={<ReservationDetailPage />} />
            <Route path="billing" element={<CuentasCobros />} />
            <Route path="invoices" element={<CuentasCobros />} />
            <Route path="cash" element={<CajaCierres />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={serviceRoles} />}>
            <Route path="food-orders" element={<PedidosAlimentos />} />
            <Route path="laundry" element={<Lavanderia />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="users" element={<UsuariosRoles />} />
          </Route>

          <Route path="403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="/huespedes" element={<Navigate to="/customers" replace />} />
      <Route path="/cobros" element={<Navigate to="/billing" replace />} />
      <Route path="/pedidos" element={<Navigate to="/food-orders" replace />} />
      <Route path="/caja" element={<Navigate to="/cash" replace />} />
      <Route path="/usuarios" element={<Navigate to="/users" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
