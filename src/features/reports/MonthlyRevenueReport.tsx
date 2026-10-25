import { useCallback, useEffect, useState } from "react";
import { reportService } from "../../services/report.service";
import type { MonthlyRevenueReportData } from "../../services/types";
import { exportCsv } from "./report-export";

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function MonthlyRevenueReport({ year }: { year: number }) {
  const [report, setReport] = useState<MonthlyRevenueReportData | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setReport(await reportService.getMonthly(year)); setError(""); } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudo cargar el reporte mensual"); } }, [year]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!report) return <p className="feature-state">Cargando reporte mensual...</p>;
  return <div className="report-panel"><header><div><h2>Ingresos mensuales · {year}</h2><p>Comparación de venta, cobro y saldo vigente.</p></div><button className="caja-secondary no-print" onClick={() => exportCsv(`ingresos-mensuales-${year}.csv`, report.months.map((row) => ({ mes: monthNames[row.month - 1], facturado: row.invoiced, cobrado: row.collected, pendiente: row.pending })))}>Exportar CSV</button></header><section className="report-kpis"><article><span>Facturado</span><strong>{money(report.totals.invoiced)}</strong></article><article><span>Cobrado</span><strong>{money(report.totals.collected)}</strong></article><article><span>Pendiente vigente</span><strong>{money(report.totals.pending)}</strong></article></section><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Mes</th><th>Facturado</th><th>Cobrado</th><th>Pendiente</th></tr></thead><tbody>{report.months.map((row) => <tr key={row.month}><td>{monthNames[row.month - 1]}</td><td>{money(row.invoiced)}</td><td>{money(row.collected)}</td><td>{money(row.pending)}</td></tr>)}</tbody></table></div></div>;
}
