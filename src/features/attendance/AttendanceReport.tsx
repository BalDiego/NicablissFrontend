import { useCallback, useEffect, useState } from "react";
import { attendanceService } from "../../services/attendance.service";
import type { AttendanceReportData } from "../../services/types";
import { exportCsv } from "../reports/report-export";
import { businessToday } from "../../utils/businessDate";
import "../reports/reports.css";

const today = businessToday(); const start = `${today.slice(0, 7)}-01`;
export default function AttendanceReport() {
  const [from, setFrom] = useState(start); const [to, setTo] = useState(today); const [report, setReport] = useState<AttendanceReportData | null>(null);
  const load = useCallback(async () => setReport(await attendanceService.report(from, to)), [from, to]); useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  return <main className="report-page"><header className="report-heading"><div><span>PERSONAL / REPORTE</span><h1>Reporte de asistencia</h1><p>Resumen mensual de presencia, tardanzas y ausencias.</p></div><button className="caja-secondary no-print" onClick={() => report && exportCsv(`asistencia-${from}-${to}.csv`, report.records.map((row) => ({ fecha: row.attendanceDate, empleado: row.userName, estado: row.status, entrada: row.checkIn, salida: row.checkOut, justificacion: row.justification })))}>Exportar CSV</button></header><div className="report-filter-row no-print"><label>Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label><button onClick={() => window.print()}>Imprimir</button></div>{report && <><section className="report-mini-kpis"><article><span>Registros</span><strong>{report.totals.records}</strong></article><article><span>Tardanzas</span><strong>{report.totals.late}</strong></article><article><span>Ausencias y permisos</span><strong>{report.totals.absences}</strong></article></section><section className="report-panel"><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Empleado</th><th>Presente</th><th>Tarde</th><th>Ausente</th><th>Permiso</th><th>Incapacidad</th></tr></thead><tbody>{report.users.map((row) => <tr key={row.userId}><td>{row.userName}</td><td>{row.presente}</td><td>{row.tarde}</td><td>{row.ausente}</td><td>{row.permiso}</td><td>{row.incapacidad}</td></tr>)}</tbody></table></div></section></>}</main>;
}
