import { useCallback, useEffect, useState } from "react";
import { reportService } from "../../services/report.service";
import type { DailyDashboardReport, MetodoPago, RevenueCategoriesReport } from "../../services/types";
import { exportCsv } from "./report-export";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function DailyRevenueReport({ date, from, method }: { date: string; from: string; method?: MetodoPago }) {
  const [daily, setDaily] = useState<DailyDashboardReport | null>(null);
  const [categories, setCategories] = useState<RevenueCategoriesReport | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [dailyData, categoryData] = await Promise.all([
        reportService.getDashboard(date, method), reportService.getCategories(from, date),
      ]);
      setDaily(dailyData); setCategories(categoryData); setError("");
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudo cargar el reporte diario"); }
  }, [date, from, method]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!daily || !categories) return <p className="feature-state">Cargando reporte diario...</p>;
  return <div className="report-panel"><header><div><h2>Ingresos diarios</h2><p>{date} · facturado no equivale a cobrado.</p></div><button className="caja-secondary no-print" onClick={() => exportCsv(`ingresos-diarios-${date}.csv`, [{ fecha: date, facturado: daily.income.invoiced, cobrado: daily.income.collected, pendiente: daily.income.pending, anticipos: daily.income.advances }])}>Exportar CSV</button></header><section className="report-kpis"><article><span>Facturado</span><strong>{money(daily.income.invoiced)}</strong></article><article><span>Cobrado</span><strong>{money(daily.income.collected)}</strong></article><article><span>Pendiente</span><strong>{money(daily.income.pending)}</strong></article><article><span>Anticipos</span><strong>{money(daily.income.advances)}</strong></article></section><h3>Facturación por categoría · {from} al {date}</h3><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Categoría</th><th>Líneas</th><th>Facturado</th></tr></thead><tbody>{categories.items.map((item) => <tr key={item.category}><td>{item.category}</td><td>{item.lineCount}</td><td>{money(item.invoiced)}</td></tr>)}</tbody></table></div></div>;
}
