import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { customerService } from "../../services/customer.service";
import { reservationService, type ReservationPayload } from "../../services/reservation.service";
import type { Customer, Room } from "../../services/types";
import "../features.css";

const initial: ReservationPayload = {
  customerId: 0, roomId: 0, fechaEntrada: "", fechaSalida: "", totalReserva: 0,
  depositType: "PERCENTAGE", depositValue: 50, observaciones: "",
};

export default function ReservationForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notify } = useFeedback();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<ReservationPayload>(() => ({ ...initial, customerId: Number(params.get("customerId")) || 0 }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { void customerService.getAll().then(setCustomers); }, []);
  const loadRooms = useCallback(async () => {
    if (!form.fechaEntrada || !form.fechaSalida || form.fechaSalida <= form.fechaEntrada) return;
    setRooms(await reservationService.getRooms(form.fechaEntrada, form.fechaSalida));
  }, [form.fechaEntrada, form.fechaSalida]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadRooms(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRooms]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await reservationService.create(form);
      notify(`Reserva ${created.codigoReserva} creada`);
      navigate(`/reservations/${created.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo crear la reserva", "error");
    } finally { setSubmitting(false); }
  };

  const estimatedDeposit = form.depositType === "PERCENTAGE"
    ? form.totalReserva * form.depositValue / 100 : form.depositValue;

  return (
    <section className="feature-page feature-form-page">
      <header className="feature-heading"><div><span>RECEPCIÓN / RESERVAS</span><h1>Nueva reserva</h1><p>Selecciona un cliente y una habitación disponible.</p></div></header>
      <form onSubmit={submit} className="feature-panel feature-form two-columns">
        <label>Cliente *<select required value={form.customerId || ""} onChange={(event) => setForm({ ...form, customerId: Number(event.target.value) })}><option value="">Seleccionar</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nombre} {customer.apellido || ""} · {customer.documento}</option>)}</select></label>
        <label>Total de reserva (USD) *<input required type="number" min="0.01" step="0.01" value={form.totalReserva || ""} onChange={(event) => setForm({ ...form, totalReserva: Number(event.target.value) })} /></label>
        <label>Entrada *<input required type="date" value={form.fechaEntrada} onChange={(event) => setForm({ ...form, fechaEntrada: event.target.value, roomId: 0 })} /></label>
        <label>Salida *<input required type="date" min={form.fechaEntrada} value={form.fechaSalida} onChange={(event) => setForm({ ...form, fechaSalida: event.target.value, roomId: 0 })} /></label>
        <label>Habitación disponible *<select required value={form.roomId || ""} onChange={(event) => setForm({ ...form, roomId: Number(event.target.value) })}><option value="">Seleccionar</option>{rooms.filter((room) => room.available).map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
        <label>Tipo de anticipo<select value={form.depositType} onChange={(event) => setForm({ ...form, depositType: event.target.value as ReservationPayload["depositType"], depositValue: event.target.value === "PERCENTAGE" ? 50 : 0 })}><option value="PERCENTAGE">Porcentaje</option><option value="FIXED">Monto fijo</option></select></label>
        <label>{form.depositType === "PERCENTAGE" ? "Porcentaje" : "Monto de anticipo"} *<input required type="number" min="0" max={form.depositType === "PERCENTAGE" ? 100 : form.totalReserva || undefined} step="0.01" value={form.depositValue} onChange={(event) => setForm({ ...form, depositValue: Number(event.target.value) })} /><small>Anticipo estimado: ${estimatedDeposit.toFixed(2)}</small></label>
        <label className="full-column">Observaciones<textarea rows={4} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
        <footer className="full-column"><button type="button" onClick={() => navigate("/reservations")}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Crear reserva"}</button></footer>
      </form>
    </section>
  );
}
