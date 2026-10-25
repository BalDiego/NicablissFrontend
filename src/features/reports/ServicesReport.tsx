import { useCallback, useEffect, useState } from "react";
import { reportService } from "../../services/report.service";
import type { ServicesReport as ServicesReportData } from "../../services/types";
import { exportCsv } from "./report-export";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
export default function ServicesReport({ from, to, category }: { from: string; to: string; category?: string }) {
  const [report, setReport] = useState<ServicesReportData | null>(null); const [error, setError] = useState("");
  const load = useCallback(async () => { try { setReport(await reportService.getServices(from, to, category)); setError(""); } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudo cargar servicios"); } }, [from, to, category]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>; if (!report) return <p className="feature-state">Cargando servicios...</p>;
  return <div className="report-panel"><header><div><h2>Servicios entregados y consumidos</h2><p>{from} al {to}</p></div><button className="caja-secondary no-print" onClick={() => exportCsv(`servicios-${from}-${to}.csv`, report.items.map((item) => ({ categoria: item.category, servicio: item.serviceName, consumos: item.consumptionCount, cantidad: item.quantity, ingresos: item.revenue })))}>Exportar CSV</button></header><section className="report-mini-kpis"><article><span>Consumos</span><strong>{report.totals.consumptionCount}</strong></article><article><span>Unidades</span><strong>{report.totals.quantity}</strong></article><article><span>Valor</span><strong>{money(report.totals.revenue)}</strong></article></section><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Categoría</th><th>Servicio</th><th>Consumos</th><th>Cantidad</th><th>Valor</th></tr></thead><tbody>{report.items.map((item) => <tr key={`${item.category}-${item.serviceName}`}><td>{item.category}</td><td>{item.serviceName}</td><td>{item.consumptionCount}</td><td>{item.quantity}</td><td>{money(item.revenue)}</td></tr>)}</tbody></table></div></div>;
}
