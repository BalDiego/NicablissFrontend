import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import LoginPage from "./pages/LoginPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./hooks/useAuth";
import "./PedidosAlimentos.css";
import "./Lavanderia.css";
import "./CajaCierres.css";
import "./UsuariosRoles.css";
import "./App.css";
import "./Login.css";
import "./polish.css";

const managementRoles = ["ADMIN", "RECEPTIONIST"] as const;
const serviceRoles = ["ADMIN", "RECEPTIONIST", "STAFF"] as const;

const Dashboard = lazy(() => import("./Dashboard"));
const PedidosAlimentos = lazy(() => import("./PedidosAlimentos"));
const Lavanderia = lazy(() => import("./Lavanderia"));
const CajaCierres = lazy(() => import("./CajaCierres"));
const UsuariosRoles = lazy(() => import("./UsuariosRoles"));
const CustomersPage = lazy(() => import("./features/customers/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./features/customers/CustomerDetailPage"));
const ReservationsPage = lazy(() => import("./features/reservations/ReservationsPage"));
const ReservationForm = lazy(() => import("./features/reservations/ReservationForm"));
const ReservationDetailPage = lazy(() => import("./features/reservations/ReservationDetailPage"));
const RoomsPage = lazy(() => import("./features/rooms/RoomsPage"));
const StaysPage = lazy(() => import("./features/stays/StaysPage"));
const StayDetailPage = lazy(() => import("./features/stays/StayDetailPage"));
const StayServicesPage = lazy(() => import("./features/services/StayServicesPage"));
const ServiceCatalogPage = lazy(() => import("./features/services/ServiceCatalogPage"));
const InvoicesPage = lazy(() => import("./features/invoices/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("./features/invoices/InvoiceDetailPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const AttendancePage = lazy(() => import("./features/attendance/AttendancePage"));
const LegacyAdministrationPage = lazy(() => import("./features/legacy/LegacyAdministrationPage"));
const AttendanceReport = lazy(() => import("./features/attendance/AttendanceReport"));
const SchedulePage = lazy(() => import("./features/attendance/SchedulePage"));

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="module-loading" role="status"><span /><p>Cargando módulo...</p></div>}>{children}</Suspense>;
}

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
          <Route path="attendance" element={<LazyRoute><AttendancePage /></LazyRoute>} />

          <Route element={<RoleGuard allowedRoles={managementRoles} />}>
            <Route path="dashboard" element={<LazyRoute><Dashboard /></LazyRoute>} />
            <Route path="customers" element={<LazyRoute><CustomersPage /></LazyRoute>} />
            <Route path="customers/:id" element={<LazyRoute><CustomerDetailPage /></LazyRoute>} />
            <Route path="reservations" element={<LazyRoute><ReservationsPage /></LazyRoute>} />
            <Route path="reservations/new" element={<LazyRoute><ReservationForm /></LazyRoute>} />
            <Route path="reservations/:id" element={<LazyRoute><ReservationDetailPage /></LazyRoute>} />
            <Route path="rooms" element={<LazyRoute><RoomsPage /></LazyRoute>} />
            <Route path="billing" element={<Navigate to="/invoices" replace />} />
            <Route path="invoices" element={<LazyRoute><InvoicesPage /></LazyRoute>} />
            <Route path="invoices/:id" element={<LazyRoute><InvoiceDetailPage /></LazyRoute>} />
            <Route path="cash" element={<LazyRoute><CajaCierres /></LazyRoute>} />
            <Route path="reports" element={<LazyRoute><ReportsPage /></LazyRoute>} />
          </Route>

          <Route element={<RoleGuard allowedRoles={serviceRoles} />}>
            <Route path="stays" element={<LazyRoute><StaysPage /></LazyRoute>} />
            <Route path="stays/:id" element={<LazyRoute><StayDetailPage /></LazyRoute>} />
            <Route path="stays/:id/services" element={<LazyRoute><StayServicesPage /></LazyRoute>} />
            <Route path="food-orders" element={<LazyRoute><PedidosAlimentos /></LazyRoute>} />
            <Route path="laundry" element={<LazyRoute><Lavanderia /></LazyRoute>} />
          </Route>

          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="service-catalog" element={<LazyRoute><ServiceCatalogPage /></LazyRoute>} />
            <Route path="users" element={<LazyRoute><UsuariosRoles /></LazyRoute>} />
            <Route path="legacy-administration" element={<LazyRoute><LegacyAdministrationPage /></LazyRoute>} />
            <Route path="attendance/report" element={<LazyRoute><AttendanceReport /></LazyRoute>} />
            <Route path="attendance/schedules" element={<LazyRoute><SchedulePage /></LazyRoute>} />
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
