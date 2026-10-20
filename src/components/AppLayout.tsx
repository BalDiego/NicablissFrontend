import { useState, useRef, useEffect } from "react";
import type { Pantalla, NavItem } from "../types";
import "./AppLayout.css";

type AppLayoutProps = {
  pantallaActual: Pantalla;
  onNavigate: (destino: Pantalla) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    id: "huespedes",
    label: "Huéspedes y estancias",
    icon: "♙",
  },
  {
    id: "cobros",
    label: "Cuentas y cobros",
    icon: "$",
  },
  {
    id: "pedidos",
    label: "Pedidos de alimentos",
    icon: "▤",
    badge: 3,
  },
  {
    id: "lavanderia",
    label: "Lavandería",
    icon: "◈",
    badge: 2,
  },
  {
    id: "caja",
    label: "Caja y cierres",
    icon: "▣",
  },
];

type Notification = {
  id: number;
  icon: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    icon: "🍽",
    title: "Nueva orden de cocina #PED-024",
    desc: "Habitación 01 solicitó 2 desayunos americanos",
    time: "Hace 10 min",
    read: false,
  },
  {
    id: 2,
    icon: "🧺",
    title: "Lavandería lista para entrega",
    desc: "Sophie Laurent (Hab. 07) - 2 prendas listas",
    time: "Hace 25 min",
    read: false,
  },
  {
    id: 3,
    icon: "💰",
    title: "Cobro registrado",
    desc: "Pago completo recibido de María González ($40.00)",
    time: "Hace 1 hora",
    read: true,
  },
];

export default function AppLayout({
  pantallaActual,
  onNavigate,
  onLogout,
  children,
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentItem = navItems.find((item) => item.id === pantallaActual) || navItems[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNavClick = (id: Pantalla) => {
    onNavigate(id);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <div className="app-layout-shell">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Adaptive Sidebar */}
      <aside
        className={`app-sidebar ${isCollapsed ? "is-collapsed" : ""} ${
          mobileOpen ? "is-mobile-open" : ""
        }`}
        aria-label="Menú principal de Nicabliss"
      >
        <div className="sidebar-header">
          <button
            type="button"
            className="brand-wrapper"
            onClick={() => handleNavClick("dashboard")}
            title="Ir al Dashboard"
          >
            <div className="brand-emblem">N</div>
            <div className="brand-text">
              <span className="brand-title">NICABLISS</span>
              <span className="brand-subtitle">HOTEL MANAGEMENT</span>
            </div>
          </button>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? "»" : "«"}
          </button>
        </div>

        <div className="sidebar-body">
          <div className="nav-group-label">MÓDULOS DE GESTIÓN</div>

          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const isActive = pantallaActual === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`nav-item-btn ${isActive ? "is-active" : ""}`}
                    onClick={() => handleNavClick(item.id)}
                    data-tooltip={item.label}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="nav-item-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer with User Profile */}
        <div className="sidebar-footer" ref={userMenuRef}>
          <button
            type="button"
            className={`sidebar-user-pill ${showUserMenu ? "is-open" : ""}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-label="Menú de usuario"
          >
            <div className="user-avatar-badge">
              AD
              <span className="user-status-dot" />
            </div>

            <div className="user-details">
              <strong className="user-name">Administrador</strong>
              <span className="user-role">Turno Recepción</span>
            </div>

            <span className="user-options-trigger">⋯</span>
          </button>

          {/* Interactive User Popover */}
          {showUserMenu && (
            <div className="user-menu-popover">
              <div className="user-menu-info-card">
                <strong>Administrador Principal</strong>
                <span>admin@nicabliss.com · Recepción</span>
              </div>

              <button
                type="button"
                className="user-menu-action"
                onClick={() => {
                  setShowUserMenu(false);
                  window.print();
                }}
              >
                <span>🖨️</span> Imprimir reporte rápido
              </button>

              <button
                type="button"
                className="user-menu-action danger"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
              >
                <span>🚪</span> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`app-main-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* Persistent Sticky Top Header */}
        <header className="app-header">
          {/* Breadcrumbs with fluid module feedback */}
          <nav className="header-breadcrumbs" aria-label="Ruta de navegación">
            <button
              type="button"
              className="breadcrumb-root-btn"
              onClick={() => onNavigate("dashboard")}
            >
              Nicabliss
            </button>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current" key={pantallaActual}>
              <span>{currentItem.icon}</span>
              <span>{currentItem.label}</span>
            </span>
          </nav>

          {/* Header Right Actions */}
          <div className="header-actions">
            <div className="system-status-indicator" title="El sistema funciona localmente sin errores">
              <span className="pulse-dot" />
              <span>Sistema en línea</span>
            </div>

            {/* Notifications Popover Trigger */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                type="button"
                className={`header-icon-btn ${showNotifications ? "is-active" : ""}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Ver notificaciones del hotel"
                title="Notificaciones"
              >
                <span>🔔</span>
                {unreadCount > 0 && <span className="icon-unread-dot" />}
              </button>

              {showNotifications && (
                <div className="dropdown-menu-popover">
                  <div className="popover-header">
                    <strong>Notificaciones activas</strong>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--hotel-green-700)",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Marcar leídas
                      </button>
                    ) : (
                      <span className="popover-badge">Al día</span>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="notification-item"
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === n.id ? { ...item, read: true } : item
                            )
                          );
                        }}
                      >
                        <div className="notification-icon">{n.icon}</div>
                        <div className="notification-body">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-desc">{n.desc}</div>
                          <div className="notification-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Avatar in Header */}
            <button
              type="button"
              className="user-avatar-badge"
              style={{ cursor: "pointer", border: "none" }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              title="Opciones de cuenta"
            >
              AD
            </button>
          </div>
        </header>

        {/* Dynamic Content Viewport */}
        <main className="app-content-viewport" key={pantallaActual}>
          {children}
        </main>
      </div>
    </div>
  );
}
