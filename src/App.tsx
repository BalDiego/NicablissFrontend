import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import Dashboard from "./Dashboard";
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
import StaysPage from "./features/stays/StaysPage";
import StayDetailPage from "./features/stays/StayDetailPage";
import StayServicesPage from "./features/services/StayServicesPage";
import ServiceCatalogPage from "./features/services/ServiceCatalogPage";
import InvoicesPage from "./features/invoices/InvoicesPage";
import InvoiceDetailPage from "./features/invoices/InvoiceDetailPage";
import ReportsPage from "./features/reports/ReportsPage";
import AttendancePage from "./features/attendance/AttendancePage";
import LegacyAdministrationPage from "./features/legacy/LegacyAdministrationPage";
import AttendanceReport from "./features/attendance/AttendanceReport";
import SchedulePage from "./features/attendance/SchedulePage";
import { useAuth } from "./hooks/useAuth";
import "./App.css";
import "./Login.css";

const managementRoles = ["ADMIN", "RECEPTIONIST"] as const;
const serviceRoles = ["ADMIN", "RECEPTIONIST", "STAFF"] as const;

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "STAFF" ? "/attendance" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="attendance" element={<AttendancePage />} />

          <Route element={<RoleGuard allowedRoles={managementRoles} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="reservations/new" element={<ReservationForm />} />
            <Route path="reservations/:id" element={<ReservationDetailPage />} />
            <Route path="billing" element={<Navigate to="/invoices" replace />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="cash" element={<CajaCierres />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={serviceRoles} />}>
            <Route path="stays" element={<StaysPage />} />
            <Route path="stays/:id" element={<StayDetailPage />} />
            <Route path="stays/:id/services" element={<StayServicesPage />} />
            <Route path="food-orders" element={<PedidosAlimentos />} />
            <Route path="laundry" element={<Lavanderia />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="service-catalog" element={<ServiceCatalogPage />} />
            <Route path="users" element={<UsuariosRoles />} />
            <Route path="legacy-administration" element={<LegacyAdministrationPage />} />
            <Route path="attendance/report" element={<AttendanceReport />} />
            <Route path="attendance/schedules" element={<SchedulePage />} />
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
