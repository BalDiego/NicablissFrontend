import { useEffect, useRef, useState } from "react";
import type { MetodoPago } from "../../services/types";
import { useBusinessToday } from "../../hooks/useBusinessToday";
import { reportService } from "../../services/report.service";
import DailyRevenueReport from "./DailyRevenueReport";
import MonthlyRevenueReport from "./MonthlyRevenueReport";
import ReceivablesReport from "./ReceivablesReport";
import ReportFilters from "./ReportFilters";
import ServicesReport from "./ServicesReport";
import { businessToday } from "../../utils/businessDate";
import { reportWorkbookFilename, saveReportWorkbook } from "./download-report";
import "../features.css";
import "./reports.css";

type Tab = "daily" | "monthly" | "services" | "receivables";
type ExportPeriod = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const businessDate = useBusinessToday();
  const [tab, setTab] = useState<Tab>("daily");
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>("daily");
  const [exportDate, setExportDate] = useState(businessDate);
  const [exportMonth, setExportMonth] = useState(businessDate.slice(0, 7));
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportDateFollowsToday = useRef(true);
  const exportMonthFollowsCurrentMonth = useRef(true);
  const [filters, setFilters] = useState<{ from: string; to: string; year: number; category: string; method: MetodoPago | "" }>(() => {
    const today = businessToday();
    return { from: `${today.slice(0, 7)}-01`, to: today, year: Number(today.slice(0, 4)), category: "", method: "" };
  });
  const followsToday = useRef(true);
  const followsBusinessMonth = useRef(true);
  const followsBusinessYear = useRef(true);
  const previousBusinessDate = useRef(businessDate);

  useEffect(() => {
    if (exportDateFollowsToday.current) setExportDate(businessDate);
    if (exportMonthFollowsCurrentMonth.current) setExportMonth(businessDate.slice(0, 7));
  }, [businessDate]);

  useEffect(() => {
    const previousDate = previousBusinessDate.current;
    if (previousDate === businessDate) return;
    previousBusinessDate.current = businessDate;
    const monthChanged = previousDate.slice(0, 7) !== businessDate.slice(0, 7);
    setFilters((current) => ({
      ...current,
      ...(followsToday.current ? { to: businessDate } : {}),
      ...(monthChanged && followsBusinessMonth.current ? { from: `${businessDate.slice(0, 7)}-01` } : {}),
      ...(followsBusinessYear.current ? { year: Number(businessDate.slice(0, 4)) } : {}),
    }));
  }, [businessDate]);

  const updateFilters = (next: Partial<{ from: string; to: string; year: number; category: string; method: MetodoPago | "" }>) => {
    if (next.to !== undefined) followsToday.current = false;
    if (next.from !== undefined) followsBusinessMonth.current = false;
    if (next.year !== undefined) followsBusinessYear.current = false;
    setFilters((current) => ({ ...current, ...next }));
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    const filenameValue = exportPeriod === "monthly" ? exportMonth : exportDate;
    try {
      const blob = await reportService.downloadWorkbook({
        period: exportPeriod,
        date: exportPeriod === "monthly" ? undefined : exportDate,
        month: exportPeriod === "monthly" ? exportMonth : undefined,
        category: filters.category || undefined,
        method: filters.method || undefined,
      });
      saveReportWorkbook(blob, reportWorkbookFilename(exportPeriod, filenameValue));
    } catch (caught: unknown) {
      setExportError(caught instanceof Error ? caught.message : "No se pudo generar el archivo Excel.");
    } finally {
      setExporting(false);
    }
  };

  const activeExportFilters = [
    filters.category ? `Categoría: ${filters.category} (facturas y servicios)` : "Categoría: todas",
    filters.method ? `Método: ${filters.method} (cobros y anticipos)` : "Método: todos",
  ].join(" · ");

  return (
    <main className="report-page">
      <header className="report-heading">
        <div>
          <span>ADMINISTRACIÓN / REPORTES</span>
          <h1>Reportes financieros</h1>
          <p>Venta facturada, dinero cobrado y saldos pendientes con fuentes contables separadas.</p>
        </div>
      </header>

      <section className="report-export no-print" aria-label="Descarga de reporte Excel">
        <div className="report-export-intro">
          <span>EXPORTACIÓN PROFESIONAL</span>
          <h2>Libro detallado en Excel</h2>
          <p>Se genera desde la base de datos e incluye resumen, facturas, líneas, pagos, cuentas por cobrar, servicios y control de Caja.</p>
          <small>{activeExportFilters}</small>
        </div>
        <div className="report-export-controls">
          <label>
            Periodo
            <select value={exportPeriod} onChange={(event) => setExportPeriod(event.target.value as ExportPeriod)}>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal · lunes a domingo</option>
              <option value="monthly">Mensual</option>
            </select>
          </label>
          <label>
            {exportPeriod === "monthly" ? "Mes a exportar" : exportPeriod === "weekly" ? "Fecha dentro de la semana" : "Día a exportar"}
            <input
              required
              type={exportPeriod === "monthly" ? "month" : "date"}
              value={exportPeriod === "monthly" ? exportMonth : exportDate}
              onChange={(event) => {
                if (exportPeriod === "monthly") {
                  exportMonthFollowsCurrentMonth.current = false;
                  setExportMonth(event.target.value);
                } else {
                  exportDateFollowsToday.current = false;
                  setExportDate(event.target.value);
                }
              }}
            />
          </label>
          <button className="report-export-button" disabled={exporting} onClick={() => void handleExport()}>
            {exporting ? "Generando Excel…" : "Descargar Excel"}
          </button>
        </div>
        {exportError && <p className="report-export-error" role="alert">{exportError}</p>}
        <p className="report-export-note">Los movimientos de Caja aparecen en una hoja operativa separada y no se suman a ingresos. La semana se calcula en hora de Managua.</p>
      </section>

      <nav className="report-tabs no-print">
        {([['daily', 'Diario'], ['monthly', 'Mensual'], ['services', 'Servicios'], ['receivables', 'Cuentas pendientes']] as [Tab, string][]).map(([value, label]) => (
          <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>
        ))}
      </nav>

      <ReportFilters
        {...filters}
        showRange={tab === "daily" || tab === "services"}
        showYear={tab === "monthly"}
        showCategory={tab === "daily" || tab === "services"}
        showMethod={tab === "daily"}
        onChange={updateFilters}
      />
      {tab === "daily" && <DailyRevenueReport date={filters.to} from={filters.from} method={filters.method || undefined} category={filters.category || undefined} />}
      {tab === "monthly" && <MonthlyRevenueReport year={filters.year} />}
      {tab === "services" && <ServicesReport from={filters.from} to={filters.to} category={filters.category || undefined} />}
      {tab === "receivables" && <ReceivablesReport />}
    </main>
  );
}
