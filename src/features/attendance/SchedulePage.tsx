import { useCallback, useEffect, useState } from "react";
import { useFeedback } from "../../hooks/useFeedback";
import { attendanceService } from "../../services/attendance.service";
import { userService } from "../../services/user.service";
import type { StaffSchedule, User } from "../../services/types";
import "../features.css";
import "../reports/reports.css";

const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function SchedulePage() {
  const { notify, confirm } = useFeedback();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ userId: "", dayOfWeek: 1, startTime: "08:00", endTime: "17:00", active: true });

  const load = useCallback(async () => {
    try {
      const [scheduleData, userData] = await Promise.all([attendanceService.getSchedules(), userService.getAll()]);
      setSchedules(scheduleData);
      setUsers(userData);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los horarios");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const employee = users.find((item) => item.id === form.userId);
    if (!(await confirm(`¿Guardar el horario de ${employee?.fullName ?? "este empleado"} para el ${days[form.dayOfWeek]}?`))) return;
    setSaving(true);
    try {
      await attendanceService.saveSchedule(form);
      notify("Horario guardado");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return <main className="report-page">
    <header className="report-heading"><div><span>PERSONAL / HORARIOS</span><h1>Horarios del personal</h1><p>Los horarios activos determinan automáticamente las tardanzas.</p></div></header>
    {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
    <section className="report-panel"><form className="report-filter-row" onSubmit={submit}>
      <label>Empleado<select required value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}><option value="">Seleccionar</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></label>
      <label>Día<select value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
      <label>Entrada<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
      <label>Salida<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
      <button className="feature-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar horario"}</button>
    </form></section>
    <section className="report-panel"><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Empleado</th><th>Día</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead><tbody>{schedules.map((row) => <tr key={row.id}><td>{row.userName}</td><td>{days[row.dayOfWeek]}</td><td>{row.startTime}</td><td>{row.endTime}</td><td>{row.active ? "Activo" : "Inactivo"}</td></tr>)}</tbody></table></div></section>
  </main>;
}
