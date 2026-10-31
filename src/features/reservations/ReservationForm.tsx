import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { useBusinessToday } from "../../hooks/useBusinessToday";
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

const reservationDraftKey = "nicabliss_reservation_draft";

interface ReservationDraft {
  form: ReservationPayload;
  customerMode: "existing" | "new";
  newCustomer: ReservationCustomerPayload;
  recordPayment: boolean;
  paymentAmountOverride: string | null;
  paymentMethod: MetodoPago;
  paymentReference: string;
}

function readReservationDraft(): Partial<ReservationDraft> | null {
  try {
    const saved = localStorage.getItem(reservationDraftKey);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed as Partial<ReservationDraft> : null;
  } catch {
    return null;
  }
}

function clearReservationDraft(): void {
  try {
    localStorage.removeItem(reservationDraftKey);
  } catch {
    // La reserva puede continuar aunque el navegador no permita limpiar localStorage.
  }
}

function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  const nights = Math.round((end - start) / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function formatDateDayFirst(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export default function ReservationForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const quickArrival = params.get("checkInNow") === "1";
  const { notify } = useFeedback();
  const businessToday = useBusinessToday();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [draft] = useState(() => quickArrival ? null : readReservationDraft());
  const [form, setForm] = useState<ReservationPayload>(() => ({
    ...initial,
    ...draft?.form,
    fechaEntrada: quickArrival ? businessToday : draft?.form?.fechaEntrada || businessToday,
    fechaSalida: quickArrival ? "" : draft?.form?.fechaSalida || "",
    customerId: Number(params.get("customerId")) || draft?.form?.customerId || 0,
  }));
  const [loadingRooms, setLoadingRooms] = useState(() => !(form.fechaEntrada && form.fechaSalida && form.fechaSalida > form.fechaEntrada));
  const [checkingAvailability, setCheckingAvailability] = useState(() => Boolean(form.fechaEntrada && form.fechaSalida && form.fechaSalida > form.fechaEntrada));
  const [roomLoadError, setRoomLoadError] = useState("");
  const [roomSelectionMessage, setRoomSelectionMessage] = useState("");
  const [roomRetryKey, setRoomRetryKey] = useState(0);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(draft?.customerMode ?? "existing");
  const [newCustomer, setNewCustomer] = useState<ReservationCustomerPayload>({ ...emptyCustomer, ...draft?.newCustomer });
  const [recordPayment, setRecordPayment] = useState(draft?.recordPayment ?? false);
  const [paymentAmountOverride, setPaymentAmountOverride] = useState<string | null>(draft?.paymentAmountOverride ?? null);
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>(draft?.paymentMethod ?? "Efectivo");
  const [paymentReference, setPaymentReference] = useState(draft?.paymentReference ?? "");
  const [submitting, setSubmitting] = useState(false);

  const depositValue = Number(form.depositValue || 0);
  const estimatedDeposit = Number((form.depositType === "PERCENTAGE"
    ? (form.totalReserva ?? 0) * depositValue / 100
    : depositValue).toFixed(2));
  const paymentAmount = paymentAmountOverride ?? (estimatedDeposit > 0 ? estimatedDeposit.toFixed(2) : "");
  const totalCents = Math.round((form.totalReserva ?? 0) * 100);
  const nights = nightsBetween(form.fechaEntrada, form.fechaSalida);
  const hasValidDateRange = Boolean(form.fechaEntrada && form.fechaSalida && form.fechaSalida > form.fechaEntrada);
  const parsedPaymentAmount = paymentAmount.trim() === "" ? 0 : Number(paymentAmount);
  const paymentCents = Number.isFinite(parsedPaymentAmount) ? Math.round(parsedPaymentAmount * 100) : 0;
  const balanceAfterPayment = Math.max(0, totalCents - (recordPayment ? paymentCents : 0)) / 100;
  const paymentExceedsTotal = recordPayment && paymentCents > totalCents;
  const formRef = useRef(form);

  useEffect(() => { void customerService.getAll().then(setCustomers); }, []);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => {
    let cancelled = false;
    const validRange = Boolean(form.fechaEntrada && form.fechaSalida && form.fechaSalida > form.fechaEntrada);

    void reservationService.getRooms(
      validRange ? form.fechaEntrada : undefined,
      validRange ? form.fechaSalida : undefined,
    ).then((loadedRooms) => {
      if (cancelled) return;
      setRooms(loadedRooms);
      const currentForm = formRef.current;
      if (validRange && currentForm.roomId) {
        const selectedRoomId = currentForm.roomId;
        const selectedRoom = loadedRooms.find((room) => room.id === selectedRoomId);
        if (!selectedRoom?.available || selectedRoom.pricePerNight <= 0) {
          setRoomSelectionMessage("La habitación seleccionada no está disponible en esas fechas. Selecciona otra.");
          setForm((current) => current.roomId === selectedRoomId ? { ...current, roomId: 0, totalReserva: 0 } : current);
        } else if (!(currentForm.totalReserva ?? 0)) {
          const stayNights = nightsBetween(currentForm.fechaEntrada, currentForm.fechaSalida);
          const suggestedTotal = Number((selectedRoom.pricePerNight * stayNights).toFixed(2));
          setForm((current) => current.roomId === selectedRoomId ? { ...current, totalReserva: suggestedTotal } : current);
        }
      }
    }).catch((error: unknown) => {
      if (cancelled) return;
      setRoomLoadError(error instanceof Error ? error.message : "No se pudieron cargar las habitaciones.");
    }).finally(() => {
      if (cancelled) return;
      setLoadingRooms(false);
      setCheckingAvailability(false);
    });

    return () => { cancelled = true; };
  }, [form.fechaEntrada, form.fechaSalida, roomRetryKey]);
  useEffect(() => {
    try {
      const reservationDraft: ReservationDraft = {
        form,
        customerMode,
        newCustomer,
        recordPayment,
        paymentAmountOverride,
        paymentMethod,
        paymentReference,
      };
      localStorage.setItem(reservationDraftKey, JSON.stringify(reservationDraft));
    } catch {
      // No bloquear el formulario si el navegador no permite usar localStorage.
    }
  }, [form, customerMode, newCustomer, recordPayment, paymentAmountOverride, paymentMethod, paymentReference]);

  const completeQuickArrival = async (reservationId: number, reservationCode: string) => {
    try {
      let reservation = await reservationService.getById(reservationId);
      if (reservation.estado === "Pendiente") {
        const depositIsCovered = Math.round(reservation.abonado * 100)
          >= Math.round(reservation.depositoRequerido * 100);
        if (!depositIsCovered) {
          notify(`Reserva ${reservationCode} creada. Registra el anticipo requerido y confirma la reserva para completar el check-in.`);
          navigate(`/reservations/${reservationId}`);
          return;
        }
        reservation = await reservationService.updateStatus(reservationId, "Confirmada");
      }

      if (reservation.estado !== "Confirmada") {
        notify(`La reserva ${reservationCode} se creó, pero está en estado ${reservation.estado}. Revisa el detalle para continuar.`, "error");
        navigate(`/reservations/${reservationId}`);
        return;
      }

      const stay = await reservationService.checkIn(reservationId);
      notify("Llegada registrada. Ya puedes agregar servicios.");
      navigate(`/stays/${stay.id}/services`);
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : "No se pudo completar el check-in";
      notify(`La reserva ${reservationCode} se creó, pero no se pudo completar la llegada: ${message}`, "error");
      navigate(`/reservations/${reservationId}`);
    }
  };

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
    if (form.depositValue === "" || !Number.isFinite(depositValue)) {
      notify("Ingresa un valor válido para el anticipo", "error");
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
        ? { ...form, totalReserva: undefined, customerId: undefined, depositValue, customer: customerInput }
        : { ...form, totalReserva: undefined, depositValue, customer: undefined };
      const created = await reservationService.create(payload);
      clearReservationDraft();

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

      if (quickArrival) {
        await completeQuickArrival(created.id, created.codigoReserva);
        return;
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
    const suggested = room && room.pricePerNight > 0 && nights > 0 && room.available
      ? Number((room.pricePerNight * nights).toFixed(2))
      : 0;
    setRoomSelectionMessage("");
    setForm({ ...form, roomId, totalReserva: suggested });
  };

  const changeDate = (field: "fechaEntrada" | "fechaSalida", value: string) => {
    const nextForm = {
      ...form,
      [field]: value,
      totalReserva: 0,
    };
    const validRange = Boolean(nextForm.fechaEntrada && nextForm.fechaSalida && nextForm.fechaSalida > nextForm.fechaEntrada);
    setForm(nextForm);
    setRoomLoadError("");
    setRoomSelectionMessage("");
    setLoadingRooms(!validRange);
    setCheckingAvailability(validRange);
  };

  const retryRoomLoad = () => {
    setRoomLoadError("");
    setLoadingRooms(!hasValidDateRange);
    setCheckingAvailability(hasValidDateRange);
    setRoomRetryKey((key) => key + 1);
  };

  return (
    <section className="feature-page feature-form-page">
      <header className="feature-heading"><div><span>RECEPCIÓN / RESERVAS</span><h1>{quickArrival ? "Llegada sin reserva" : "Nueva reserva"}</h1><p>{quickArrival ? "Registra al huésped y la habitación; si se cubre el anticipo requerido, el sistema completa el check-in automáticamente." : "Selecciona un cliente existente o registra al huésped en el momento; la habitación congela su precio actual."}</p></div></header>
      <form onSubmit={submit} className="feature-panel feature-form two-columns">
        <div className="full-column reservation-customer-switch" role="group" aria-label="Tipo de cliente">
          <button type="button" className={customerMode === "existing" ? "feature-primary" : "feature-link"} aria-pressed={customerMode === "existing"} onClick={() => setCustomerMode("existing")}>Cliente existente</button>
          <button type="button" className={customerMode === "new" ? "feature-primary" : "feature-link"} aria-pressed={customerMode === "new"} onClick={() => setCustomerMode("new")}>Registrar nuevo cliente</button>
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

        <div className="reservation-date-field">
          <label htmlFor="reservation-check-in">Entrada *</label>
          <input id="reservation-check-in" required type="date" value={form.fechaEntrada} onChange={(event) => changeDate("fechaEntrada", event.target.value)} />
          <small className="reservation-date-hint">{form.fechaEntrada ? `Fecha: ${formatDateDayFirst(form.fechaEntrada)} (DD/MM/AAAA)` : "Formato: DD/MM/AAAA"}</small>
        </div>
        <div className="reservation-date-field">
          <label htmlFor="reservation-check-out">Salida *</label>
          <input id="reservation-check-out" required type="date" min={form.fechaEntrada} value={form.fechaSalida} onChange={(event) => changeDate("fechaSalida", event.target.value)} />
          <small className="reservation-date-hint">{form.fechaSalida ? `Fecha: ${formatDateDayFirst(form.fechaSalida)} (DD/MM/AAAA)` : "Formato: DD/MM/AAAA"}</small>
        </div>
        <div className="reservation-room-field">
          <label htmlFor="reservation-room">Habitación disponible *</label>
          <select id="reservation-room" required value={form.roomId || ""} disabled={loadingRooms || checkingAvailability || Boolean(roomLoadError)} onChange={(event) => selectRoom(Number(event.target.value))}>
            <option value="">{loadingRooms ? "Cargando habitaciones…" : checkingAvailability ? "Verificando disponibilidad…" : "Seleccionar"}</option>
            {rooms.map((room) => {
              const unavailableForDates = hasValidDateRange && !room.available;
              const noRate = room.pricePerNight <= 0;
              const detail = noRate ? "Tarifa sin configurar" : `$${room.pricePerNight.toFixed(2)}/noche`;
              const availabilityDate = room.availableFrom && room.availableFrom >= businessToday
                ? ` · Disponible desde ${formatDateDayFirst(room.availableFrom)}`
                : " · Fecha de disposición por confirmar";
              const status = !room.active
                ? " · Inactiva"
                : unavailableForDates
                  ? ` · Ocupada${availabilityDate}`
                  : hasValidDateRange
                    ? " · Disponible"
                    : room.available
                      ? " · Selecciona fechas para confirmar"
                      : ` · Ocupada${availabilityDate}`;
              return <option key={room.id} value={room.id} disabled={!room.active || noRate || unavailableForDates}>{room.name} · {detail}{status}</option>;
            })}
          </select>
          {loadingRooms && <small className="reservation-room-status" role="status">Cargando habitaciones disponibles…</small>}
          {checkingAvailability && <small className="reservation-room-status" role="status">Consultando disponibilidad para las fechas seleccionadas…</small>}
          {!loadingRooms && !checkingAvailability && !hasValidDateRange && !roomLoadError && <small className="reservation-room-status">Las habitaciones ya están cargadas. Selecciona fechas para confirmar disponibilidad.</small>}
          {!loadingRooms && !checkingAvailability && hasValidDateRange && !roomLoadError && rooms.length === 0 && <small className="reservation-room-status" role="status">No hay habitaciones activas registradas.</small>}
          {!loadingRooms && !checkingAvailability && hasValidDateRange && !roomLoadError && rooms.length > 0 && !rooms.some((room) => room.available && room.pricePerNight > 0) && <small className="reservation-room-status" role="status">No hay habitaciones con tarifa disponibles para estas fechas.</small>}
          {roomLoadError && <div className="reservation-room-error" role="alert"><span>{roomLoadError}</span><button type="button" onClick={retryRoomLoad}>Reintentar</button></div>}
          {roomSelectionMessage && <small className="reservation-room-status" role="status">{roomSelectionMessage}</small>}
        </div>
        <label>Tipo de anticipo<select value={form.depositType} onChange={(event) => setForm({ ...form, depositType: event.target.value as ReservationPayload["depositType"], depositValue: event.target.value === "PERCENTAGE" ? 50 : "" })}><option value="PERCENTAGE">Porcentaje</option><option value="FIXED">Monto fijo</option></select></label>
        <label>{form.depositType === "PERCENTAGE" ? "Porcentaje" : "Monto de anticipo"} *<input required type="number" min="0" max={form.depositType === "PERCENTAGE" ? 100 : form.totalReserva || undefined} step="0.01" value={form.depositValue} onChange={(event) => setForm({ ...form, depositValue: event.target.value })} /><small>Anticipo estimado: ${estimatedDeposit.toFixed(2)}</small></label>
        <section className="full-column reservation-summary" aria-label="Resumen de la reserva">
          <header className="reservation-summary-heading">
            <div><h2>Resumen de la reserva</h2><p>Revisa el total y el saldo antes de confirmar.</p></div>
            {form.roomId > 0 && nights > 0 && <span>{nights} {nights === 1 ? "noche" : "noches"}</span>}
          </header>
          <div className="reservation-summary-metrics">
            <div className="reservation-summary-total"><span>Total de hospedaje</span><strong aria-label="Total de hospedaje calculado (USD)">${(totalCents / 100).toFixed(2)}</strong></div>
            <div><span>Noches</span><strong>{nights > 0 ? nights : "—"}</strong></div>
            <div><span>Anticipo estimado</span><strong>${estimatedDeposit.toFixed(2)}</strong></div>
            <div className="reservation-summary-balance"><span>Saldo pendiente</span><strong>${balanceAfterPayment.toFixed(2)}</strong></div>
          </div>
        </section>
        <label className="full-column">Observaciones<textarea rows={4} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
        <section className="full-column reservation-payment-panel" aria-label="Pago inicial">
          <label className="feature-checkbox"><input type="checkbox" checked={recordPayment} disabled={totalCents <= 0} onChange={(event) => { setRecordPayment(event.target.checked); setPaymentAmountOverride(null); }} /> Registrar pago ahora (opcional)</label>
          {recordPayment ? (
            <div className="reservation-payment-fields">
              <label>Monto recibido (USD) *<input required type="number" min="0.01" max={form.totalReserva} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmountOverride(event.target.value)} /></label>
              <label>Método de pago *<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as MetodoPago)}><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option><option value="Transferencia">Transferencia</option></select></label>
              {paymentMethod !== "Efectivo" && <label className="full-column">Referencia *<input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></label>}
              {paymentExceedsTotal && <p className="feature-error full-column" role="alert">El pago no puede superar el total de la reserva.</p>}
            </div>
          ) : <p className="reservation-payment-hint">{quickArrival ? "Para completar el check-in ahora, registra el anticipo requerido. Si queda pendiente, podrás continuarlo desde el detalle de la reserva." : "Puedes registrar un pago inicial ahora o dejarlo pendiente para más tarde."}</p>}
        </section>
        <footer className="full-column"><button type="button" onClick={() => { clearReservationDraft(); navigate(quickArrival ? "/stays" : "/reservations"); }}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : quickArrival ? "Crear reserva y registrar llegada" : "Crear reserva"}</button></footer>
      </form>
    </section>
  );
}
