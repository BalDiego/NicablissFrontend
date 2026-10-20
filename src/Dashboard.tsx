import { useState, useEffect } from "react";
import type { Pantalla } from "./types";
import { dashboardService } from "./services/dashboard.service";
import { foodOrderService } from "./services/foodOrder.service";
import type { DashboardMetrics, FoodOrder } from "./services/types";
import "./App.css";

const fallbackStats = [
  {
    label: "Ingresos del día",
    value: "$ 0.00",
    detail: "Pagos registrados",
    code: "revenue",
    className: "stat-green",
  },
  {
    label: "Cuentas abiertas",
    value: "0",
    detail: "Huéspedes con saldo activo",
    code: "accounts",
    className: "stat-blue",
  },
  {
    label: "Pedidos pendientes",
    value: "0",
    detail: "Solicitudes por atender",
    code: "orders",
    className: "stat-orange",
  },
  {
    label: "Lavandería pendiente",
    value: "0",
    detail: "Solicitudes en proceso",
    code: "laundry",
    className: "stat-purple",
  },
];

type DashboardProps = {
  onNavigate: (destino: Pantalla) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingOrders, setPendingOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metr, orders] = await Promise.all([
        dashboardService.getMetrics(),
        foodOrderService.getAll(),
      ]);
      setMetrics(metr);
      const pendientes = orders.filter(
        (o) => o.estado !== "Entregado" && o.estado !== "Cancelado"
      );
      setPendingOrders(pendientes.length > 0 ? pendientes.slice(0, 3) : orders.slice(0, 3));
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error al conectar con el servidor.";
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const stats = metrics?.stats || fallbackStats;
  const transactions = metrics?.recentTransactions || [];

  return (
    <div className="dashboard-content">
      <section className="page-heading">
        <div>
          <span className="page-eyebrow">OPERACIONES · RECEPCIÓN</span>
          <h2>Resumen general</h2>
          <p>
            Panel de control ejecutivo de Nicabliss Hotel. Indicadores y transacciones en tiempo real.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="date-button"
            onClick={cargarDatos}
            disabled={loading}
          >
            {loading ? "Sincronizando..." : "Actualizar datos"}
          </button>
          <button
            type="button"
            className="date-button"
            onClick={() => window.print()}
          >
            Reporte / Imprimir
          </button>
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            color: "#ef4444",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Error de conexión: {error}</span>
          <button
            type="button"
            onClick={cargarDatos}
            style={{
              padding: "0.4rem 0.8rem",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="stats-grid" aria-label="Indicadores principales">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-card-top">
              <span className="stat-label">{stat.label}</span>
              <span className={`stat-icon ${stat.className}`}>
                {stat.code === "revenue"
                  ? "$"
                  : stat.code === "accounts"
                  ? "≡"
                  : stat.code === "orders"
                  ? "↗"
                  : "◈"}
              </span>
            </div>
            <strong className="stat-value">
              {loading && !metrics ? "..." : stat.value}
            </strong>
            <span className="stat-detail">{stat.detail}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel transactions-panel">
          <div className="panel-header">
            <div>
              <h3>Transacciones recientes</h3>
              <p>Últimos movimientos registrados en el servidor</p>
            </div>
            <a
              href="#cuentas"
              className="panel-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("cobros");
              }}
            >
              Ver todas <span>→</span>
            </a>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Huésped</th>
                  <th>Servicio</th>
                  <th>Fecha</th>
                  <th>Importe</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                      {loading ? "Cargando transacciones..." : "No hay transacciones registradas."}
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, idx) => (
                    <tr key={`${transaction.guest}-${transaction.service}-${idx}`}>
                      <td>
                        <div className="guest-cell">
                          <span className="guest-avatar">
                            {transaction.guest
                              ? transaction.guest
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()
                              : "GH"}
                          </span>
                          <strong>{transaction.guest}</strong>
                        </div>
                      </td>
                      <td>{transaction.service}</td>
                      <td className="date-cell">{transaction.date}</td>
                      <td className="amount-cell">{transaction.amount}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            transaction.status === "Completado" || transaction.status === "Pagado"
                              ? "status-complete"
                              : "status-pending"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="panel-footer">
            {loading ? "Sincronizando con Nicabliss API..." : `Mostrando ${transactions.length} transacciones recientes`}
          </div>
        </article>

        <article className="panel orders-panel">
          <div className="panel-header">
            <div>
              <h3>Pedidos de alimentos</h3>
              <p>Seguimiento de solicitudes de cocina</p>
            </div>
            <a
              href="#pedidos"
              className="panel-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("pedidos");
              }}
            >
              Ver todos <span>→</span>
            </a>
          </div>

          <div className="orders-list">
            {pendingOrders.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                {loading ? "Cargando pedidos..." : "No hay pedidos pendientes en este momento."}
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div className="order-item" key={order.id}>
                  <div className="order-top">
                    <strong>{order.orderCode || `#PED-${order.id}`}</strong>
                    <span
                      className={`order-status ${
                        order.estado === "Pendiente"
                          ? "order-waiting"
                          : order.estado === "En preparación" || order.estado === "En camino"
                          ? "order-preparing"
                          : "order-ready"
                      }`}
                    >
                      {order.estado}
                    </span>
                  </div>
                  <div className="order-guest">{order.huesped} - {order.habitacion}</div>
                  <div className="order-detail">{order.productos}</div>
                  <div className="order-time">
                    <span>Fecha / Registro</span>
                    <span>{order.fecha}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="bottom-notice">
        <div className="notice-icon">i</div>
        <div>
          <strong>Estado de sincronización</strong>
          <p>
            Servicios conectados con Nicabliss API. Turno de caja:{" "}
            {metrics?.cashRegisterActive ? "Activo" : "Cerrado"} · Huéspedes activos:{" "}
            {metrics?.activeStays ?? 0}
          </p>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>© 2026 Nicabliss Hotel · Sistema de gestión empresarial</span>
        <span>Panel administrativo centralizado</span>
      </footer>
    </div>
  );
}