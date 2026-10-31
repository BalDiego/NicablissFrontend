import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { customerService } from "../../services/customer.service";
import {
  reservationService,
  type ReservationCustomerPayload,
  type ReservationPayload,
} from "../../services/reservation.service";
import type { Customer, MetodoPago, Room } from "../../services/types";
import "../features.css";

const initial: ReservationPayload = {
  customerId: 0, roomId: 0, fechaEntrada: "", fechaSalida: "", totalReserva: 0,
  depositType: "PERCENTAGE", depositValue: 50, observaciones: "",
};

const emptyCustomer: ReservationCustomerPayload = {
  nombre: "", apellido: "", documento: "", telefono: "", correo: "", direccion: "",
};

function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  const nights = Math.round((end - start) / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

export default function ReservationForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notify } = useFeedback();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<ReservationPayload>(() => ({ ...initial, customerId: Number(params.get("customerId")) || 0 }));
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [newCustomer, setNewCustomer] = useState<ReservationCustomerPayload>(emptyCustomer);
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmountOverride, setPaymentAmountOverride] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>("Efectivo");
  const [paymentReference, setPaymentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const estimatedDeposit = Number((form.depositType === "PERCENTAGE"
    ? (form.totalReserva ?? 0) * form.depositValue / 100
    : form.depositValue).toFixed(2));
  const paymentAmount = paymentAmountOverride ?? (estimatedDeposit > 0 ? estimatedDeposit.toFixed(2) : "");
  const totalCents = Math.round((form.totalReserva ?? 0) * 100);
  const parsedPaymentAmount = paymentAmount.trim() === "" ? 0 : Number(paymentAmount);
  const paymentCents = Number.isFinite(parsedPaymentAmount) ? Math.round(parsedPaymentAmount * 100) : 0;
  const balanceAfterPayment = Math.max(0, totalCents - (recordPayment ? paymentCents : 0)) / 100;
  const paymentExceedsTotal = recordPayment && paymentCents > totalCents;

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
    if (submitting) return;
    if (customerMode === "existing" && !form.customerId) {
      notify("Selecciona un cliente o registra uno nuevo", "error");
      return;
    }
    if (customerMode === "new" && (!newCustomer.nombre.trim() || !newCustomer.documento.trim())) {
      notify("El nombre y el documento del nuevo cliente son obligatorios", "error");
      return;
    }
    if (!form.roomId || totalCents <= 0) {
      notify("Selecciona una habitación con tarifa configurada y fechas válidas", "error");
      return;
    }
    if (recordPayment && (paymentAmount.trim() === "" || paymentCents <= 0 || paymentCents > totalCents)) {
      notify("El pago debe ser mayor que $0.00 y no puede superar el total de la reserva", "error");
      return;
    }
    if (recordPayment && paymentMethod !== "Efectivo" && !paymentReference.trim()) {
      notify("La referencia es obligatoria para pagos con tarjeta o transferencia", "error");
      return;
    }
    setSubmitting(true);
    try {
      const customerInput: ReservationCustomerPayload = {
        nombre: newCustomer.nombre.trim(),
        documento: newCustomer.documento.trim(),
        apellido: newCustomer.apellido?.trim() || undefined,
        telefono: newCustomer.telefono?.trim() || undefined,
        correo: newCustomer.correo?.trim() || undefined,
        direccion: newCustomer.direccion?.trim() || undefined,
      };
      const payload: ReservationPayload = customerMode === "new"
        ? { ...form, totalReserva: undefined, customerId: undefined, customer: customerInput }
        : { ...form, totalReserva: undefined, customer: undefined };
      const created = await reservationService.create(payload);

      if (recordPayment) {
        try {
          await reservationService.createPayment(created.id, {
            amount: paymentCents / 100,
            paymentMethod,
            reference: paymentReference.trim() || undefined,
          }, crypto.randomUUID());
        } catch (paymentError: unknown) {
          const message = paymentError instanceof Error ? paymentError.message : "No se pudo registrar el pago";
          notify(`La reserva ${created.codigoReserva} se creó, pero el pago no se registró: ${message}`, "error");
          navigate(`/reservations/${created.id}`);
          return;
        }
      }

      notify(recordPayment
        ? `Reserva ${created.codigoReserva} creada y pago registrado`
        : `Reserva ${created.codigoReserva} creada`);
      navigate(`/reservations/${created.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo crear la reserva", "error");
    } finally { setSubmitting(false); }
  };

  const selectRoom = (roomId: number) => {
    const room = rooms.find((item) => item.id === roomId);
    const nights = nightsBetween(form.fechaEntrada, form.fechaSalida);
    const suggested = room && room.available && room.pricePerNight > 0 && nights > 0
      ? Number((room.pricePerNight * nights).toFixed(2))
      : 0;
    setForm({ ...form, roomId, totalReserva: suggested });
  };

  const changeDate = (field: "fechaEntrada" | "fechaSalida", value: string) => {
    setForm({
      ...form,
      [field]: value,
      roomId: 0,
      totalReserva: 0,
    });
  };

  return (
    <section className="feature-page feature-form-page">
      <header className="feature-heading"><div><span>RECEPCIÓN / RESERVAS</span><h1>Nueva reserva</h1><p>Selecciona un cliente existente o registra al huésped en el momento; la habitación congela su precio actual.</p></div></header>
      <form onSubmit={submit} className="feature-panel feature-form two-columns">
        <div className="full-column feature-inline-switch">
          <button type="button" className={customerMode === "existing" ? "feature-primary" : "feature-link"} onClick={() => setCustomerMode("existing")}>Cliente existente</button>
          <button type="button" className={customerMode === "new" ? "feature-primary" : "feature-link"} onClick={() => setCustomerMode("new")}>Registrar nuevo cliente</button>
        </div>

        {customerMode === "existing" ? (
          <label>Cliente *<select required value={form.customerId || ""} onChange={(event) => setForm({ ...form, customerId: Number(event.target.value) })}><option value="">Seleccionar</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nombre} {customer.apellido || ""} · {customer.documento}</option>)}</select></label>
        ) : (
          <>
            <label>Nombre del huésped *<input required value={newCustomer.nombre} onChange={(event) => setNewCustomer({ ...newCustomer, nombre: event.target.value })} /></label>
            <label>Apellido<input value={newCustomer.apellido || ""} onChange={(event) => setNewCustomer({ ...newCustomer, apellido: event.target.value })} /></label>
            <label>Documento *<input required value={newCustomer.documento} onChange={(event) => setNewCustomer({ ...newCustomer, documento: event.target.value })} /></label>
            <label>Teléfono<input value={newCustomer.telefono || ""} onChange={(event) => setNewCustomer({ ...newCustomer, telefono: event.target.value })} /></label>
            <label>Correo<input type="email" value={newCustomer.correo || ""} onChange={(event) => setNewCustomer({ ...newCustomer, correo: event.target.value })} /></label>
          </>
        )}

        <label>Total de hospedaje calculado (USD) *<input required type="number" min="0.01" step="0.01" value={form.totalReserva ? form.totalReserva.toFixed(2) : ""} readOnly /></label>
        <label>Entrada *<input required type="date" value={form.fechaEntrada} onChange={(event) => changeDate("fechaEntrada", event.target.value)} /></label>
        <label>Salida *<input required type="date" min={form.fechaEntrada} value={form.fechaSalida} onChange={(event) => changeDate("fechaSalida", event.target.value)} /></label>
        <label>Habitación disponible *<select required value={form.roomId || ""} onChange={(event) => selectRoom(Number(event.target.value))}><option value="">Seleccionar</option>{rooms.filter((room) => room.available).map((room) => <option key={room.id} value={room.id} disabled={room.pricePerNight <= 0}>{room.name}{room.pricePerNight > 0 ? ` · $${room.pricePerNight.toFixed(2)}/noche` : " · Tarifa sin configurar"}</option>)}</select></label>
        <label>Tipo de anticipo<select value={form.depositType} onChange={(event) => setForm({ ...form, depositType: event.target.value as ReservationPayload["depositType"], depositValue: event.target.value === "PERCENTAGE" ? 50 : 0 })}><option value="PERCENTAGE">Porcentaje</option><option value="FIXED">Monto fijo</option></select></label>
        <label>{form.depositType === "PERCENTAGE" ? "Porcentaje" : "Monto de anticipo"} *<input required type="number" min="0" max={form.depositType === "PERCENTAGE" ? 100 : form.totalReserva || undefined} step="0.01" value={form.depositValue} onChange={(event) => setForm({ ...form, depositValue: Number(event.target.value) })} /><small>Anticipo estimado: ${estimatedDeposit.toFixed(2)}</small></label>
        <section className="full-column reservation-payment-panel" aria-label="Pago inicial">
          <label className="feature-checkbox"><input type="checkbox" checked={recordPayment} disabled={totalCents <= 0} onChange={(event) => { setRecordPayment(event.target.checked); setPaymentAmountOverride(null); }} /> Registrar pago ahora (opcional)</label>
          {recordPayment ? (
            <div className="reservation-payment-fields">
              <label>Monto recibido (USD) *<input required type="number" min="0.01" max={form.totalReserva} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmountOverride(event.target.value)} /></label>
              <label>Método de pago *<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as MetodoPago)}><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option><option value="Transferencia">Transferencia</option></select></label>
              {paymentMethod !== "Efectivo" && <label className="full-column">Referencia *<input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></label>}
              {paymentExceedsTotal && <p className="feature-error full-column" role="alert">El pago no puede superar el total de la reserva.</p>}
              <p className="reservation-debt full-column" role="status">Saldo pendiente después del pago: <strong>${balanceAfterPayment.toFixed(2)}</strong></p>
            </div>
          ) : (
            <p className="reservation-debt" role="status">Saldo pendiente sin pago inicial: <strong>${(totalCents / 100).toFixed(2)}</strong></p>
          )}
        </section>
        <label className="full-column">Observaciones<textarea rows={4} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
        <footer className="full-column"><button type="button" onClick={() => navigate("/reservations")}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Crear reserva"}</button></footer>
      </form>
    </section>
  );
}
