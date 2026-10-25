import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { attendanceService } from "../../services/attendance.service";
import { userService } from "../../services/user.service";
import type { AttendanceRecord, User } from "../../services/types";
import MyAttendance from "./MyAttendance";
import "../features.css";
import "../reports/reports.css";

type AbsenceForm = {
  userId: string;
  attendanceDate: string;
  status: "Ausente" | "Permiso" | "Incapacidad";
  justification: string;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAbsence, setShowAbsence] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [absence, setAbsence] = useState<AbsenceForm>({
    userId: "",
    attendanceDate: new Date().toISOString().slice(0, 10),
    status: "Ausente",
    justification: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [attendance, staff] = await Promise.all([
        attendanceService.today(),
        user?.role === "ADMIN" ? userService.getAll() : Promise.resolve([]),
      ]);
      setRows(attendance);
      setUsers(staff);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la asistencia");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveAbsence = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const employee = users.find((item) => item.id === absence.userId);
    if (!(await confirm(`¿Registrar ${absence.status.toLowerCase()} para ${employee?.fullName ?? "este empleado"}?`))) return;
    setSubmitting(true);
    try {
      await attendanceService.absence(absence);
      notify("Ausencia registrada");
      setShowAbsence(false);
      setAbsence((current) => ({ ...current, userId: "", justification: "" }));
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="report-page">
      <header className="report-heading">
        <div><span>PERSONAL / ASISTENCIA</span><h1>Asistencia</h1><p>Entradas, salidas, presencia y tardanzas del día.</p></div>
        {user?.role === "ADMIN" && <div className="feature-actions">
          <button onClick={() => setShowAbsence(true)}>Registrar ausencia</button>
          <Link className="feature-primary" to="/attendance/report">Reporte mensual</Link>
          <Link to="/attendance/schedules">Horarios</Link>
        </div>}
      </header>

      {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
      <MyAttendance onChanged={() => void load()} />

      {user?.role !== "STAFF" && <section className="report-panel">
        <header><div><h2>Personal de hoy</h2><p>{rows.filter((item) => item.checkIn && !item.checkOut).length} personas presentes actualmente.</p></div></header>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead><tr><th>Empleado</th><th>Estado</th><th>Entrada</th><th>Salida</th><th>Justificación</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>
              <td>{row.userName}</td><td>{row.status}</td>
              <td>{row.checkIn ? new Date(row.checkIn).toLocaleTimeString("es-NI") : "—"}</td>
              <td>{row.checkOut ? new Date(row.checkOut).toLocaleTimeString("es-NI") : "—"}</td>
              <td>{row.justification || "—"}</td>
            </tr>)}</tbody>
          </table>
          {loading && <p className="feature-state">Actualizando asistencia...</p>}
        </div>
      </section>}

      {showAbsence && <div className="feature-overlay"><div className="feature-modal">
        <header><h2>Registrar ausencia</h2><button onClick={() => setShowAbsence(false)} disabled={submitting}>×</button></header>
        <form className="feature-form" onSubmit={saveAbsence}>
          <label>Empleado<select required value={absence.userId} onChange={(event) => setAbsence({ ...absence, userId: event.target.value })}><option value="">Seleccionar</option>{users.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
          <label>Fecha<input required type="date" value={absence.attendanceDate} onChange={(event) => setAbsence({ ...absence, attendanceDate: event.target.value })} /></label>
          <label>Estado<select value={absence.status} onChange={(event) => setAbsence({ ...absence, status: event.target.value as AbsenceForm["status"] })}><option>Ausente</option><option>Permiso</option><option>Incapacidad</option></select></label>
          <label>Justificación<textarea required minLength={3} value={absence.justification} onChange={(event) => setAbsence({ ...absence, justification: event.target.value })} /></label>
          <footer><button type="button" onClick={() => setShowAbsence(false)} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</button></footer>
        </form>
      </div></div>}
    </main>
  );
}
