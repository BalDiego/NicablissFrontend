import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "./services/dashboard.service";
import { useAutoRefresh } from "./hooks/useAutoRefresh";
import { useBusinessToday } from "./hooks/useBusinessToday";
import type { DailyDashboardReport, MetodoPago } from "./services/types";
import { formatBusinessDateTime } from "./utils/businessDate";
import "./App.css";
import "./features/features.css";
import "./features/reports/reports.css";

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compactMoneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const money = (value: number) => moneyFormatter.format(value);
const chartColors = ["#2f7962", "#c09143", "#56778a", "#8a6d9b"];

function DashboardSkeleton() {
  return <div className="dashboard-skeleton" aria-label="Cargando indicadores">
    <div className="dashboard-skeleton-kpis">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
    <div className="dashboard-skeleton-charts"><span /><span /></div>
  </div>;
}

function FinancialComparison({ income }: { income: DailyDashboardReport["income"] }) {
  const rows = [
    { label: "Facturado", value: income.invoiced, tone: "invoiced" },
    { label: "Cobrado", value: income.collected, tone: "collected" },
    { label: "Pendiente", value: income.pending, tone: "pending" },
    { label: "Anticipos", value: income.advances, tone: "advances" },
  ];
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  return <div className="dashboard-comparison" role="img" aria-label="Comparativo de facturación, cobros, saldo pendiente y anticipos">
    {rows.map((row) => <div className="dashboard-comparison-row" key={row.label}>
      <div><span>{row.label}</span><strong>{money(row.value)}</strong></div>
      <div className="dashboard-comparison-track"><span className={`tone-${row.tone}`} style={{ width: `${Math.abs(row.value) / max * 100}%` }} /></div>
    </div>)}
  </div>;
}

function PaymentMethodsChart({ items }: { items: DailyDashboardReport["byMethod"] }) {
  const normalized = items.map((item) => ({ ...item, chartValue: Math.max(0, item.amount) }));
  const total = normalized.reduce((sum, item) => sum + item.chartValue, 0);
  const segments = normalized.map((item, index) => {
    const percentage = total > 0 ? item.chartValue / total * 100 : 0;
    const previous = normalized.slice(0, index).reduce((sum, current) => sum + current.chartValue, 0);
    return { ...item, percentage, offset: total > 0 ? -(previous / total * 100) : 0 };
  });

  return <div className="dashboard-donut-layout">
    <div className="dashboard-donut" role="img" aria-label={`Distribución de ${items.length} métodos de pago`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="dashboard-donut-base" cx="60" cy="60" r="45" pathLength="100" />
        {segments.map((item, index) => {
          return <circle key={item.method} className="dashboard-donut-segment" cx="60" cy="60" r="45" pathLength="100" stroke={chartColors[index % chartColors.length]} strokeDasharray={`${item.percentage} ${100 - item.percentage}`} strokeDashoffset={item.offset}>
            <title>{item.method}: {money(item.amount)}</title>
          </circle>;
        })}
      </svg>
      <div><strong>{compactMoneyFormatter.format(total)}</strong><span>Total neto</span></div>
    </div>
    <div className="dashboard-donut-legend">
      {normalized.map((item, index) => <div key={item.method}>
        <span className="dashboard-legend-dot" style={{ background: chartColors[index % chartColors.length] }} />
        <span><strong>{item.method}</strong><small>{item.operationCount} operaciones</small></span>
        <b>{money(item.amount)}</b>
      </div>)}
      {items.length === 0 && <p>Sin cobros registrados en esta fecha.</p>}
    </div>
  </div>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const businessDate = useBusinessToday();
  const [date, setDate] = useState(businessDate);
  const [method, setMethod] = useState<MetodoPago | "">("");
  const [report, setReport] = useState<DailyDashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const loadedFilterKey = useRef("");
  const followsToday = useRef(true);

  useEffect(() => {
    if (followsToday.current) setDate(businessDate);
  }, [businessDate]);

  const load = useCallback(async (force = false) => {
    const currentRequest = ++requestId.current;
    const filterKey = `${date}|${method}`;
    const hasCurrentReport = loadedFilterKey.current === filterKey;
    if (!hasCurrentReport) setLoading(true);
    try {
      const next = await dashboardService.getDaily(date, method || undefined, undefined, { force });
      if (currentRequest !== requestId.current) return;
      setReport(next);
      loadedFilterKey.current = filterKey;
      setError("");
    } catch (caught: unknown) {
      if (currentRequest !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el dashboard");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [date, method]);

  useAutoRefresh(load);

  const visibleReport = report?.date === date && (report.filters.method || "") === method ? report : null;
  const maxCategory = useMemo(() => Math.max(1, ...(visibleReport?.byCategory.map((item) => item.amount) ?? [1])), [visibleReport]);

  return (
    <main className="report-page dashboard-report">
      <header className="report-heading no-print">
        <div><span>ADMINISTRACIÓN / DASHBOARD</span><h1>Resumen financiero diario</h1><p>Una lectura clara del rendimiento operativo y financiero del hotel.</p></div>
        <div className="report-actions">
          <label>Fecha<input type="date" value={date} onChange={(event) => { followsToday.current = false; setDate(event.target.value); }} /></label>
          <label>Método<select value={method} onChange={(event) => setMethod(event.target.value as MetodoPago | "")}><option value="">Todos</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
          <button onClick={() => void load(true)} disabled={loading}>{loading ? "Actualizando..." : "Actualizar"}</button>
          <button onClick={() => window.print()}>Imprimir</button>
          <button onClick={() => navigate("/reports")}>Ver reportes</button>
        </div>
      </header>

      {error && <div className="feature-error">{error}<button onClick={() => void load(true)}>Reintentar</button></div>}
      {!visibleReport && !error && <DashboardSkeleton />}
      {visibleReport && <>
        <section className="report-kpis dashboard-primary-kpis">
          <article><span>Cobrado</span><strong>{money(visibleReport.income.collected)}</strong><small>Dinero recibido en la fecha</small></article>
          <article><span>Facturado</span><strong>{money(visibleReport.income.invoiced)}</strong><small>Comprobantes emitidos</small></article>
          <article><span>Saldo pendiente vigente</span><strong>{money(visibleReport.income.pending)}</strong><small>{visibleReport.receivables.count} cuentas abiertas al consultar</small></article>
          <article><span>Anticipos</span><strong>{money(visibleReport.income.advances)}</strong><small>Cobros previos a emisión</small></article>
        </section>

        <section className="dashboard-chart-grid">
          <article className="report-panel dashboard-chart-panel">
            <header><div><span className="dashboard-panel-eyebrow">FLUJO DEL DÍA</span><h2>Comparativo financiero</h2><p>Escala relativa sobre el mayor importe del periodo.</p></div></header>
            <FinancialComparison income={visibleReport.income} />
          </article>
          <article className="report-panel dashboard-chart-panel">
            <header><div><span className="dashboard-panel-eyebrow">COMPOSICIÓN DE COBROS</span><h2>Métodos de pago</h2><p>Distribución neta de las operaciones registradas.</p></div></header>
            <PaymentMethodsChart items={visibleReport.byMethod} />
          </article>
        </section>

        <section className="report-mini-kpis dashboard-operational-kpis">
          <article><span>Clientes activos</span><strong>{visibleReport.activeCustomers}</strong><small>Con estancia vigente</small></article>
          <article><span>Reservas creadas</span><strong>{visibleReport.reservations.created}</strong><small>Durante la fecha</small></article>
          <article><span>Llegadas / salidas</span><strong>{visibleReport.reservations.arrivals} / {visibleReport.reservations.departures}</strong><small>Movimiento previsto</small></article>
          <article><span>Estado actual de caja</span><strong className={visibleReport.cash.open ? "positive" : "negative"}>{visibleReport.cash.open ? "Abierta" : "Cerrada"}</strong><small>{visibleReport.cash.responsible || "Sin turno activo"}</small></article>
        </section>

        <section className="report-panel dashboard-category-panel">
          <header><div><span className="dashboard-panel-eyebrow">DISTRIBUCIÓN DE VENTAS</span><h2>Facturación por categoría</h2><p>Participación de cada línea de negocio en la facturación emitida.</p></div><strong className="dashboard-panel-total">{money(visibleReport.byCategory.reduce((sum, item) => sum + item.amount, 0))}</strong></header>
          <div className="report-bars dashboard-category-bars">{visibleReport.byCategory.map((item, index) => <div key={item.category}>
            <div><span><i style={{ background: chartColors[index % chartColors.length] }} />{item.category}</span><strong>{money(item.amount)}</strong></div>
            <div className="report-bar-track category"><span style={{ width: `${item.amount / maxCategory * 100}%`, background: chartColors[index % chartColors.length] }} /></div>
          </div>)}{visibleReport.byCategory.length === 0 && <p className="feature-state">Sin facturación para la fecha seleccionada.</p>}</div>
        </section>

        <section className="report-panel">
          <header><div><span className="dashboard-panel-eyebrow">ACTIVIDAD RECIENTE</span><h2>Últimos pagos</h2><p>Operaciones más recientes del día seleccionado.</p></div><button className="feature-link no-print" onClick={() => navigate("/cash")}>Ver caja</button></header>
          <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Pago</th><th>Cliente</th><th>Reserva</th><th>Método</th><th>Fecha</th><th>Importe</th></tr></thead><tbody>{visibleReport.recentPayments.map((payment) => <tr key={payment.paymentNumber}><td><strong>{payment.paymentNumber}</strong><small>{payment.kind === "REVERSAL" ? "Reversión" : "Cobro"}</small></td><td>{payment.customerName}</td><td>{payment.reservationCode || "—"}</td><td>{payment.method}</td><td>{formatBusinessDateTime(payment.paymentDate)}</td><td className={payment.amount < 0 ? "negative" : "positive"}>{money(payment.amount)}</td></tr>)}</tbody></table>{visibleReport.recentPayments.length === 0 && <p className="feature-state">No hay pagos en esta fecha.</p>}</div>
        </section>

        <footer className="report-updated">Datos actualizados: {formatBusinessDateTime(visibleReport.updatedAt)}</footer>
      </>}
    </main>
  );
}
