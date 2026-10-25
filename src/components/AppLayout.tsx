import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../services/types";
import "./AppLayout.css";

type NavItem = {
  path: string;
  label: string;
  icon: string;
  roles: readonly UserRole[];
  badge?: number;
};

const allRoles = ["ADMIN", "RECEPTIONIST", "STAFF"] as const;
const managementRoles = ["ADMIN", "RECEPTIONIST"] as const;

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "01", roles: managementRoles },
  { path: "/attendance", label: "Mi asistencia", icon: "02", roles: allRoles },
  { path: "/customers", label: "Clientes", icon: "03", roles: managementRoles },
  { path: "/reservations", label: "Reservas", icon: "03", roles: managementRoles },
  { path: "/stays", label: "Estancias", icon: "04", roles: allRoles },
  { path: "/invoices", label: "Facturas y cobros", icon: "05", roles: managementRoles },
  { path: "/food-orders", label: "Pedidos de alimentos", icon: "06", roles: allRoles },
  { path: "/laundry", label: "Lavandería", icon: "07", roles: allRoles },
  { path: "/cash", label: "Caja y cierres", icon: "08", roles: managementRoles },
  { path: "/reports", label: "Reportes", icon: "09", roles: managementRoles },
  { path: "/service-catalog", label: "Catálogo de servicios", icon: "10", roles: ["ADMIN"] },
  { path: "/users", label: "Usuarios y roles", icon: "11", roles: ["ADMIN"] },
];

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
            {isCollapsed ? "→" : "←"}
          </button>
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-body">
          <div className="nav-group-label">MÓDULOS DE GESTIÓN</div>
          <ul className="sidebar-nav-list">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `nav-item-btn ${isActive ? "is-active" : ""}`}
                  data-tooltip={item.label}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-label">{item.label}</span>
                  {item.badge !== undefined && <span className="nav-item-badge">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
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
                <span>{currentItem?.icon}</span>
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
                <span style={{ fontSize: "11px", fontWeight: 700 }}>AVISOS</span>
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
