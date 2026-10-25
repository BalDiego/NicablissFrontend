import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { attendanceService } from "../../services/attendance.service";
import type { AttendanceRecord } from "../../services/types";

export default function MyAttendance({ onChanged }: { onChanged?: () => void }) {
  const { user } = useAuth(); const { notify, confirm } = useFeedback(); const [record, setRecord] = useState<AttendanceRecord | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { const rows = await attendanceService.today(); setRecord(rows.find((item) => item.userId === user?.id) ?? null); }, [user?.id]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const action = async (type: "in" | "out") => { if (!(await confirm(type === "in" ? "¿Registrar entrada ahora?" : "¿Registrar salida ahora?"))) return; setLoading(true); try { const value = type === "in" ? await attendanceService.checkIn() : await attendanceService.checkOut(); setRecord(value); notify(type === "in" ? "Entrada registrada" : "Salida registrada"); onChanged?.(); } catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudo registrar asistencia", "error"); } finally { setLoading(false); } };
  return <article className="report-panel"><header><div><h2>Mi asistencia de hoy</h2><p>{record ? `Estado: ${record.status}` : "Aún no has registrado entrada."}</p></div><div className="feature-actions"><button className="feature-primary" disabled={loading || Boolean(record?.checkIn)} onClick={() => void action("in")}>Registrar entrada</button><button disabled={loading || !record?.checkIn || Boolean(record?.checkOut)} onClick={() => void action("out")}>Registrar salida</button></div></header>{record && <section className="report-mini-kpis"><article><span>Entrada</span><strong>{record.checkIn ? new Date(record.checkIn).toLocaleTimeString("es-NI") : "—"}</strong></article><article><span>Salida</span><strong>{record.checkOut ? new Date(record.checkOut).toLocaleTimeString("es-NI") : "Pendiente"}</strong></article><article><span>Estado</span><strong>{record.status}</strong></article></section>}</article>;
}
