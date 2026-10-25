import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "./services/dashboard.service";
import type { DailyDashboardReport, MetodoPago } from "./services/types";
import "./App.css";
import "./features/reports/reports.css";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Dashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<MetodoPago | "">("");
  const [report, setReport] = useState<DailyDashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await dashboardService.getDaily(date, method || undefined));
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, [date, method]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const maxMethod = useMemo(() => Math.max(1, ...(report?.byMethod.map((item) => Math.abs(item.amount)) ?? [1])), [report]);
  const maxCategory = useMemo(() => Math.max(1, ...(report?.byCategory.map((item) => item.amount) ?? [1])), [report]);

  return (
    <main className="report-page dashboard-report">
      <header className="report-heading no-print">
        <div><span>ADMINISTRACIÓN / DASHBOARD</span><h1>Resumen financiero diario</h1><p>Facturado, cobrado y pendiente se presentan por separado.</p></div>
        <div className="report-actions">
          <label>Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Método<select value={method} onChange={(event) => setMethod(event.target.value as MetodoPago | "")}><option value="">Todos</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
          <button onClick={() => void load()} disabled={loading}>{loading ? "Actualizando..." : "Actualizar"}</button>
          <button onClick={() => window.print()}>Imprimir</button>
          <button onClick={() => navigate("/reports")}>Ver reportes</button>
        </div>
      </header>

      {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
      {!report && !error && <p className="feature-state">Cargando indicadores...</p>}
      {report && <>
        <section className="report-kpis">
          <article><span>Cobrado</span><strong>{money(report.income.collected)}</strong><small>Dinero recibido en la fecha</small></article>
          <article><span>Facturado</span><strong>{money(report.income.invoiced)}</strong><small>Comprobantes emitidos</small></article>
          <article><span>Saldo pendiente</span><strong>{money(report.income.pending)}</strong><small>{report.receivables.count} cuentas abiertas</small></article>
          <article><span>Anticipos</span><strong>{money(report.income.advances)}</strong><small>Cobros previos a emisión</small></article>
        </section>

        <section className="report-mini-kpis">
          <article><span>Clientes activos</span><strong>{report.activeCustomers}</strong></article>
          <article><span>Reservas creadas</span><strong>{report.reservations.created}</strong></article>
          <article><span>Llegadas / salidas</span><strong>{report.reservations.arrivals} / {report.reservations.departures}</strong></article>
          <article><span>Estado de caja</span><strong className={report.cash.open ? "positive" : "negative"}>{report.cash.open ? "Abierta" : "Cerrada"}</strong></article>
        </section>

        <section className="report-grid-two">
          <article className="report-panel">
            <header><div><h2>Cobrado por método</h2><p>Pagos netos de reversiones.</p></div></header>
            <div className="report-bars">{report.byMethod.map((item) => <div key={item.method}><div><span>{item.method}</span><strong>{money(item.amount)}</strong></div><div className="report-bar-track"><span style={{ width: `${Math.abs(item.amount) / maxMethod * 100}%` }} /></div><small>{item.operationCount} operaciones</small></div>)}</div>
          </article>
          <article className="report-panel">
            <header><div><h2>Facturado por categoría</h2><p>Líneas de facturas emitidas.</p></div></header>
            <div className="report-bars">{report.byCategory.map((item) => <div key={item.category}><div><span>{item.category}</span><strong>{money(item.amount)}</strong></div><div className="report-bar-track category"><span style={{ width: `${item.amount / maxCategory * 100}%` }} /></div></div>)}{report.byCategory.length === 0 && <p className="feature-state">Sin facturación para la fecha.</p>}</div>
          </article>
        </section>

        <section className="report-panel">
          <header><div><h2>Pagos recientes</h2><p>Últimas operaciones del día seleccionado.</p></div><button className="feature-link no-print" onClick={() => navigate("/cash")}>Ver caja</button></header>
          <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Pago</th><th>Cliente</th><th>Reserva</th><th>Método</th><th>Fecha</th><th>Importe</th></tr></thead><tbody>{report.recentPayments.map((payment) => <tr key={payment.paymentNumber}><td><strong>{payment.paymentNumber}</strong><small>{payment.kind === "REVERSAL" ? "Reversión" : "Cobro"}</small></td><td>{payment.customerName}</td><td>{payment.reservationCode || "—"}</td><td>{payment.method}</td><td>{new Date(payment.paymentDate).toLocaleString("es-NI")}</td><td className={payment.amount < 0 ? "negative" : "positive"}>{money(payment.amount)}</td></tr>)}</tbody></table>{report.recentPayments.length === 0 && <p className="feature-state">No hay pagos en esta fecha.</p>}</div>
        </section>

        <footer className="report-updated">Última actualización: {new Date(report.updatedAt).toLocaleString("es-NI")}</footer>
      </>}
    </main>
  );
}
