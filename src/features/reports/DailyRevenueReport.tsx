import { useCallback, useRef, useState } from "react";
import { reportService } from "../../services/report.service";
import type { DailyDashboardReport, MetodoPago, RevenueCategoriesReport } from "../../services/types";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function DailyRevenueReport({ date, from, method, category }: { date: string; from: string; method?: MetodoPago; category?: string }) {
  const [daily, setDaily] = useState<DailyDashboardReport | null>(null);
  const [categories, setCategories] = useState<RevenueCategoriesReport | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const load = useCallback(async (force = false) => {
    const currentRequest = ++requestId.current;
    try {
      const [dailyData, categoryData] = await Promise.all([
        reportService.getDashboard(date, method, category, { force }), reportService.getCategories(from, date, category),
      ]);
      if (currentRequest !== requestId.current) return;
      setDaily(dailyData); setCategories(categoryData); setError("");
    } catch (caught: unknown) {
      if (currentRequest === requestId.current) setError(caught instanceof Error ? caught.message : "No se pudo cargar el reporte diario");
    }
  }, [date, from, method, category]);
  useAutoRefresh(load);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load(true)}>Reintentar</button></div>;
  if (!daily || !categories) return <p className="feature-state">Cargando reporte diario...</p>;
  const activeFilters = [
    method ? `Método ${method} aplicado solo a cobros y anticipos` : "",
    category ? `Categoría ${category} aplicada a facturación` : "",
  ].filter(Boolean);
  return <div className="report-panel"><header><div><h2>Ingresos diarios</h2><p>{date} · facturado no equivale a cobrado. El saldo pendiente es vigente al consultar.{activeFilters.length > 0 && <> · {activeFilters.join(" · ")}</>}</p></div></header><section className="report-kpis"><article><span>Facturado{category ? ` · ${category}` : ""}</span><strong>{money(daily.income.invoiced)}</strong></article><article><span>Cobrado{method ? ` · ${method}` : ""}</span><strong>{money(daily.income.collected)}</strong></article><article><span>Saldo pendiente vigente</span><strong>{money(daily.income.pending)}</strong></article><article><span>Anticipos{method ? ` · ${method}` : ""}</span><strong>{money(daily.income.advances)}</strong></article></section><h3>Facturación por categoría · {from} al {date}{category ? ` · ${category}` : ""}</h3><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Categoría</th><th>Líneas</th><th>Facturado</th></tr></thead><tbody>{categories.items.map((item) => <tr key={item.category}><td>{item.category}</td><td>{item.lineCount}</td><td>{money(item.invoiced)}</td></tr>)}</tbody></table>{categories.items.length === 0 && <p className="feature-state">No hay facturación para los filtros seleccionados.</p>}</div></div>;
}
