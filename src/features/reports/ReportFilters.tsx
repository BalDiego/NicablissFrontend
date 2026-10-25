import type { MetodoPago } from "../../services/types";

export default function ReportFilters({ from, to, year, category, method, showRange = true, showYear = false, onChange }: {
  from: string;
  to: string;
  year: number;
  category: string;
  method: MetodoPago | "";
  showRange?: boolean;
  showYear?: boolean;
  onChange: (next: Partial<{ from: string; to: string; year: number; category: string; method: MetodoPago | "" }>) => void;
}) {
  return <div className="report-filter-row no-print">
    {showRange && <><label>Desde<input type="date" value={from} onChange={(event) => onChange({ from: event.target.value })} /></label><label>Hasta<input type="date" value={to} onChange={(event) => onChange({ to: event.target.value })} /></label></>}
    {showYear && <label>Año<input type="number" min="2000" max="2100" value={year} onChange={(event) => onChange({ year: Number(event.target.value) })} /></label>}
    <label>Categoría<select value={category} onChange={(event) => onChange({ category: event.target.value })}><option value="">Todas</option><option>Hospedaje</option><option>Alimentos</option><option>Lavandería</option><option>Minibar</option><option>Transporte</option><option>Otro</option></select></label>
    <label>Método<select value={method} onChange={(event) => onChange({ method: event.target.value as MetodoPago | "" })}><option value="">Todos</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
  </div>;
}
