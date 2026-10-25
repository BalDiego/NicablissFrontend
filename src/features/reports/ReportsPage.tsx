import { useState } from "react";
import type { MetodoPago } from "../../services/types";
import DailyRevenueReport from "./DailyRevenueReport";
import MonthlyRevenueReport from "./MonthlyRevenueReport";
import ReceivablesReport from "./ReceivablesReport";
import ReportFilters from "./ReportFilters";
import ServicesReport from "./ServicesReport";
import { businessToday } from "../../utils/businessDate";
import "../features.css";
import "./reports.css";

type Tab = "daily" | "monthly" | "services" | "receivables";
const now = new Date(); const today = businessToday(now); const monthStart = `${today.slice(0, 7)}-01`;
export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [filters, setFilters] = useState<{ from: string; to: string; year: number; category: string; method: MetodoPago | "" }>({ from: monthStart, to: today, year: now.getFullYear(), category: "", method: "" });
  return <main className="report-page"><header className="report-heading"><div><span>ADMINISTRACIÓN / REPORTES</span><h1>Reportes financieros</h1><p>Venta facturada, dinero cobrado y saldos pendientes con fuentes contables separadas.</p></div><button className="caja-secondary no-print" onClick={() => window.print()}>Imprimir reporte</button></header><nav className="report-tabs no-print">{([['daily','Diario'],['monthly','Mensual'],['services','Servicios'],['receivables','Cuentas pendientes']] as [Tab,string][]).map(([value,label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}</nav><ReportFilters {...filters} showRange={tab !== "monthly" && tab !== "receivables"} showYear={tab === "monthly"} onChange={(next) => setFilters((current) => ({ ...current, ...next }))} />{tab === "daily" && <DailyRevenueReport date={filters.to} from={filters.from} method={filters.method || undefined} />}{tab === "monthly" && <MonthlyRevenueReport year={filters.year} />}{tab === "services" && <ServicesReport from={filters.from} to={filters.to} category={filters.category || undefined} />}{tab === "receivables" && <ReceivablesReport />}</main>;
}
