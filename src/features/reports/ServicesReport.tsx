import { useCallback, useRef, useState } from "react";
import { reportService } from "../../services/report.service";
import type { ServicesReport as ServicesReportData } from "../../services/types";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
export default function ServicesReport({ from, to, category }: { from: string; to: string; category?: string }) {
  const [report, setReport] = useState<ServicesReportData | null>(null); const [error, setError] = useState("");
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const data = await reportService.getServices(from, to, category);
      if (currentRequest !== requestId.current) return;
      setReport(data); setError("");
    } catch (caught: unknown) {
      if (currentRequest === requestId.current) setError(caught instanceof Error ? caught.message : "No se pudo cargar servicios");
    }
  }, [from, to, category]);
  useAutoRefresh(load);
  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>; if (!report) return <p className="feature-state">Cargando servicios...</p>;
  return <div className="report-panel"><header><div><h2>Servicios entregados y consumidos</h2><p>{from} al {to}</p></div></header><section className="report-mini-kpis"><article><span>Consumos</span><strong>{report.totals.consumptionCount}</strong></article><article><span>Unidades</span><strong>{report.totals.quantity}</strong></article><article><span>Valor</span><strong>{money(report.totals.revenue)}</strong></article></section><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Categoría</th><th>Servicio</th><th>Consumos</th><th>Cantidad</th><th>Valor</th></tr></thead><tbody>{report.items.map((item) => <tr key={`${item.category}-${item.serviceName}`}><td>{item.category}</td><td>{item.serviceName}</td><td>{item.consumptionCount}</td><td>{item.quantity}</td><td>{money(item.revenue)}</td></tr>)}</tbody></table></div></div>;
}
