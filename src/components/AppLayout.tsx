import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../services/types";
import "./AppLayout.css";

type NavItem = {
  path: string;
  label: string;
  icon: string;
  group: "Operación" | "Finanzas" | "Administración";
  roles: readonly UserRole[];
  badge?: number;
};

const allRoles = ["ADMIN", "RECEPTIONIST", "STAFF"] as const;
const managementRoles = ["ADMIN", "RECEPTIONIST"] as const;

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Resumen ejecutivo", icon: "dashboard", group: "Operación", roles: managementRoles },
  { path: "/attendance", label: "Mi asistencia", icon: "clock", group: "Operación", roles: allRoles },
  { path: "/customers", label: "Clientes", icon: "users", group: "Operación", roles: managementRoles },
  { path: "/reservations", label: "Reservas", icon: "calendar", group: "Operación", roles: managementRoles },
  { path: "/stays", label: "Estancias", icon: "bed", group: "Operación", roles: allRoles },
  { path: "/food-orders", label: "Alimentos", icon: "utensils", group: "Operación", roles: allRoles },
  { path: "/laundry", label: "Lavandería", icon: "laundry", group: "Operación", roles: allRoles },
  { path: "/invoices", label: "Facturas y cobros", icon: "receipt", group: "Finanzas", roles: managementRoles },
  { path: "/cash", label: "Caja y cierres", icon: "wallet", group: "Finanzas", roles: managementRoles },
  { path: "/reports", label: "Reportes", icon: "chart", group: "Finanzas", roles: managementRoles },
  { path: "/service-catalog", label: "Catálogo de servicios", icon: "services", group: "Administración", roles: ["ADMIN"] },
  { path: "/users", label: "Usuarios y roles", icon: "shield", group: "Administración", roles: ["ADMIN"] },
  { path: "/legacy-administration", label: "Datos heredados", icon: "archive", group: "Administración", roles: ["ADMIN"] },
];

const navGroups: NavItem["group"][] = ["Operación", "Finanzas", "Administración"];

function AppIcon({ name, size = 19 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 15l2 2 5-5" /></>,
    bed: <><path d="M3 19v-8M21 19v-6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4M3 17h18M6 11V7h5a2 2 0 0 1 2 2v2" /></>,
    utensils: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c-2 2-3 5-3 8h3" /></>,
    laundry: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h.01M12 6h4" /><circle cx="12" cy="14" r="5" /><path d="M9 13c2 0 2 2 4 2 1 0 2-.5 3-1" /></>,
    receipt: <><path d="M6 2l2 2 2-2 2 2 2-2 2 2 2-2v20l-2-2-2 2-2-2-2 2-2-2-2 2V2Z" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
    wallet: <><path d="M4 6V4a2 2 0 0 1 2-2h12v4M4 6h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path d="M16 13h6" /><circle cx="17" cy="13" r="1" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    services: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /><circle cx="12" cy="12" r="4" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    archive: <><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v11h14V9M9 13h6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    print: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
  };
  return <svg className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.dashboard}</svg>;
}

type Notification = {
  id: number;
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [];

function getInitials(name?: string): string {
  if (!name) return "US";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRoleLabel(role?: UserRole): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "RECEPTIONIST") return "Recepción";
  if (role === "STAFF") return "Staff operativo";
  return "Personal";
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));
  const currentItem =
    visibleItems.find((item) => location.pathname.startsWith(item.path)) || visibleItems[0];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`app-sidebar ${isCollapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
        aria-label="Menú principal de Nicabliss"
      >
        <div className="sidebar-header">
          <button type="button" className="brand-wrapper" onClick={() => goTo("/dashboard")}>
            <div className="brand-emblem">N</div>
            <div className="brand-text">
              <span className="brand-title">NICABLISS</span>
              <span className="brand-subtitle">HOTEL MANAGEMENT</span>
            </div>
          </button>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <AppIcon name="chevron" size={17} />
          </button>
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div className="sidebar-body">
          {navGroups.map((group) => {
            const groupItems = visibleItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return <section className="nav-group" key={group}>
              <div className="nav-group-label">{group}</div>
              <ul className="sidebar-nav-list">
                {groupItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `nav-item-btn ${isActive ? "is-active" : ""}`}
                      data-tooltip={item.label}
                    >
                      <span className="nav-item-icon"><AppIcon name={item.icon} /></span>
                      <span className="nav-item-label">{item.label}</span>
                      {item.badge !== undefined && <span className="nav-item-badge">{item.badge}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>;
          })}
        </div>

        <div className="sidebar-footer" ref={userMenuRef}>
          <button
            type="button"
            className={`sidebar-user-pill ${showUserMenu ? "is-open" : ""}`}
            onClick={() => setShowUserMenu((current) => !current)}
            aria-expanded={showUserMenu}
          >
            <div className="user-avatar-badge">
              {getInitials(user?.fullName || user?.username)}
              <span className="user-status-dot" />
            </div>
            <div className="user-details">
              <strong className="user-name">{user?.fullName}</strong>
              <span className="user-role">{getRoleLabel(user?.role)}</span>
            </div>
            <span className="user-options-trigger">⋯</span>
          </button>

          {showUserMenu && (
            <div className="user-menu-popover">
              <div className="user-menu-info-card">
                <strong>{user?.fullName}</strong>
                <span>{user?.email} • {getRoleLabel(user?.role)}</span>
              </div>
              {user?.role === "ADMIN" && (
                <button type="button" className="user-menu-action" onClick={() => goTo("/users")}>
                  Gestionar usuarios y roles
                </button>
              )}
              <button type="button" className="user-menu-action" onClick={() => window.print()}>
                Imprimir vista actual
              </button>
              <button type="button" className="user-menu-action danger" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`app-main-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>
            <nav className="header-breadcrumbs" aria-label="Ruta de navegación">
              <Link className="breadcrumb-root-btn" to="/dashboard">Nicabliss</Link>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">
                 <AppIcon name={currentItem?.icon || "dashboard"} size={16} />
                <span>{currentItem?.label || "Módulo"}</span>
              </span>
            </nav>
          </div>

          <div className="header-actions">
            <div className="system-status-indicator" title="Sesión conectada">
              <span className="pulse-dot" />
              <span>Sistema en línea</span>
            </div>
            <div style={{ position: "relative" }} ref={notificationRef}>
              <button
                type="button"
                className={`header-icon-btn ${showNotifications ? "is-active" : ""}`}
                onClick={() => setShowNotifications((current) => !current)}
                aria-label="Ver notificaciones"
              >
                <AppIcon name="bell" size={18} />
                {unreadCount > 0 && <span className="icon-unread-dot" />}
              </button>
              {showNotifications && (
                <div className="dropdown-menu-popover">
                  <div className="popover-header">
                    <strong>Notificaciones activas</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))}
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <p style={{ padding: "1rem", color: "#64748b" }}>No hay avisos pendientes.</p>
                    ) : notifications.map((notification) => (
                      <div className="notification-item" key={notification.id}>
                        <div className="notification-icon">{notification.icon}</div>
                        <div className="notification-body">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-desc">{notification.description}</div>
                          <div className="notification-time">{notification.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
