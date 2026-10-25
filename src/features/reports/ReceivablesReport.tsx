import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../services/report.service";
import type { ReceivablesReportData } from "../../services/types";
import { exportCsv } from "./report-export";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
export default function ReceivablesReport() {
  const navigate = useNavigate(); const [report, setReport] = useState<ReceivablesReportData | null>(null); const [error, setError] = useState("");
  const load = useCallback(async () => { try { setReport(await reportService.getReceivables()); setError(""); } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudieron cargar cuentas pendientes"); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>; if (!report) return <p className="feature-state">Cargando cuentas pendientes...</p>;
  return <div className="report-panel"><header><div><h2>Cuentas por cobrar</h2><p>{report.totals.count} facturas con saldo.</p></div><button className="caja-secondary no-print" onClick={() => exportCsv("cuentas-por-cobrar.csv", report.items.map((item) => ({ factura: item.invoiceNumber, cliente: item.customerName, reserva: item.reservationCode, total: item.total, pagado: item.paid, saldo: item.balance, antiguedad_dias: item.ageDays })))}>Exportar CSV</button></header><section className="report-kpis"><article><span>Saldo total</span><strong>{money(report.totals.balance)}</strong></article><article><span>Cuentas abiertas</span><strong>{report.totals.count}</strong></article></section><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Factura</th><th>Cliente</th><th>Reserva</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Antigüedad</th><th /></tr></thead><tbody>{report.items.map((item) => <tr key={item.invoiceId}><td>{item.invoiceNumber}</td><td><strong>{item.customerName}</strong><small>{item.customerDocument}</small></td><td>{item.reservationCode}<small>{item.room}</small></td><td>{money(item.total)}</td><td>{money(item.paid)}</td><td className="negative">{money(item.balance)}</td><td>{item.ageDays} días</td><td><button className="feature-link no-print" onClick={() => navigate(`/invoices/${item.invoiceId}`)}>Ver</button></td></tr>)}</tbody></table></div></div>;
}
