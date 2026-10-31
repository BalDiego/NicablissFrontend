import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService } from "../../services/reservation.service";
import { serviceService } from "../../services/service.service";
import type {
  Payment,
  Reservation,
  ReservationAccount,
  ReservationStatus,
  ServiceCatalog,
} from "../../services/types";
import PaymentHistory from "../payments/PaymentHistory";
import PaymentModal from "../payments/PaymentModal";
import ReservationConsumptions from "./ReservationConsumptions";
import "../features.css";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ReservationDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [account, setAccount] = useState<ReservationAccount | null>(null);
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reservationData, paymentData] = await Promise.all([
        reservationService.getById(id), reservationService.getPayments(id),
      ]);
      let accountData: ReservationAccount | null = null;
      try {
        accountData = await reservationService.getAccount(id);
      } catch {
        accountData = null;
      }
      let catalogData: ServiceCatalog[] = [];
      try {
        catalogData = await serviceService.getCatalog(false);
      } catch {
        catalogData = [];
      }
      setReservation(reservationData);
      setAccount(accountData);
      setCatalog(catalogData);
      setPayments(paymentData);
      setError("");
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudo cargar la reserva"); }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const changeStatus = async (status: ReservationStatus) => {
    if (updatingStatus) return;
    if (status === "Cancelada" && !(await confirm("¿Cancelar esta reserva? La operación quedará registrada en auditoría."))) return;
    setUpdatingStatus(true);
    try { await reservationService.updateStatus(id, status); notify("Estado actualizado"); await load(); }
    catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudo actualizar", "error"); }
    finally { setUpdatingStatus(false); }
  };

  const checkIn = async () => {
    if (checkingIn) return;
    if (!(await confirm("¿Registrar el check-in de esta reserva?"))) return;
    setCheckingIn(true);
    try {
      const stay = await reservationService.checkIn(id);
      notify("Check-in registrado correctamente");
      navigate(`/stays/${stay.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el check-in", "error");
    } finally {
      setCheckingIn(false);
    }
  };

  const checkOut = async () => {
    if (checkingOut || !account?.stayId) return;
    if (!(await confirm("¿Registrar el check-out, emitir la factura y cerrar la cuenta de la reserva?"))) return;
    setCheckingOut(true);
    try {
      const result = await reservationService.checkout(id);
      notify(`Check-out registrado. Factura ${result.invoice.invoiceNumber} emitida`);
      navigate(`/invoices/${result.invoice.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el check-out", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  if (error) return <div className="feature-error">{error}</div>;
  if (!reservation) return <p className="feature-state">Cargando reserva...</p>;

  const paymentLimit = account ? account.balance : reservation.saldo;
  const canRegisterPayment = paymentLimit > 0
    && ["Pendiente", "Confirmada", "CheckIn", "Finalizada"].includes(reservation.estado);
  const busy = checkingIn || checkingOut || updatingStatus;

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div>
          <span>RESERVA / {reservation.codigoReserva}</span>
          <h1>{reservation.customerName}</h1>
          <p>{reservation.habitacion} · {reservation.fechaEntrada} al {reservation.fechaSalida} · {reservation.nights} {reservation.nights === 1 ? "noche" : "noches"}</p>
        </div>
        <div className="feature-actions">
          <Link className="feature-link" to={`/customers/${reservation.customerId}`}>Ver cliente e historial</Link>
          {reservation.estado === "Pendiente" && Math.round(reservation.abonado * 100) >= Math.round(reservation.depositoRequerido * 100) && <button className="feature-primary" onClick={() => void changeStatus("Confirmada")} disabled={busy}>{updatingStatus ? "Confirmando..." : "Confirmar reserva"}</button>}
          {reservation.estado === "Confirmada" && <button className="feature-primary" onClick={() => void checkIn()} disabled={busy}>{checkingIn ? "Registrando..." : "Registrar check-in"}</button>}
          {account?.status === "Activa" && <button className="feature-primary" onClick={() => void checkOut()} disabled={busy}>{checkingOut ? "Facturando..." : "Registrar check-out y facturar"}</button>}
          {canRegisterPayment && <button onClick={() => setShowPayment(true)} disabled={busy}>Registrar pago</button>}
          {["Pendiente", "Confirmada"].includes(reservation.estado) && <button onClick={() => void changeStatus("Cancelada")} disabled={busy}>{updatingStatus ? "Cancelando..." : "Cancelar reserva"}</button>}
        </div>
      </header>

      <div className="feature-detail-grid">
        <article><span>Total</span><strong>{money(reservation.totalReserva)}</strong></article>
        <article><span>Anticipo requerido</span><strong>{money(reservation.depositoRequerido)}</strong></article>
        <article><span>Abonado</span><strong>{money(reservation.abonado)}</strong></article>
        <article><span>Saldo de cuenta</span><strong>{money(paymentLimit)}</strong></article>
        <article><span>Estado</span><strong>{reservation.estado}</strong></article>
        <article><span>Documento</span><strong>{reservation.customerDocument}</strong></article>
      </div>

      {account && (
        <section className="feature-panel reservation-account-panel" aria-label="Cuenta de la reserva">
          <div className="feature-section-title">
            <div>
              <h2>Cuenta de la reserva</h2>
              <p>Precio congelado de la habitación: {money(account.roomPricePerNight)} por noche × {account.nights} {account.nights === 1 ? "noche" : "noches"}.</p>
            </div>
            {account.stayId && <Link className="feature-link" to={`/stays/${account.stayId}`}>Ver estancia</Link>}
          </div>
          <div className="feature-detail-grid">
            <article><span>Hospedaje</span><strong>{money(account.lodging)}</strong></article>
            <article><span>Consumos facturables</span><strong>{money(account.services)}</strong></article>
            <article><span>Consumos pendientes</span><strong>{money(account.pendingServicesAmount)}</strong></article>
            <article><span>Total de cuenta</span><strong>{money(account.total)}</strong></article>
            <article><span>Pagos aplicados</span><strong>{money(account.paid)}</strong></article>
            <article><span>Diferencia</span><strong>{money(account.balance)}</strong></article>
          </div>
          {account.invoice && (
            <p className="feature-state">
              Factura {account.invoice.invoiceNumber} · {account.invoice.status} · Saldo facturado {money(account.invoice.balance)}.{" "}
              <Link className="feature-link" to={`/invoices/${account.invoice.id}`}>Ver factura</Link>
            </p>
          )}
          {account.stayId && <p className="feature-state">Entrada: {account.checkInAt ? new Date(account.checkInAt).toLocaleString("es-NI") : "—"}{account.checkOutAt ? ` · Salida: ${new Date(account.checkOutAt).toLocaleString("es-NI")}` : ""}</p>}
        </section>
      )}

      {account?.stayId && (
        <ReservationConsumptions
          account={account}
          catalog={catalog}
          isAdmin={user?.role === "ADMIN"}
          onChanged={() => void load()}
        />
      )}

      <div className="feature-section-title"><div><h2>Historial de pagos</h2><p>Cada abono y reversión se conserva individualmente.</p></div></div>
      <PaymentHistory payments={payments} onChanged={() => void load()} />
      <Link className="feature-link" to="/reservations">← Volver a reservas</Link>
      {showPayment && <PaymentModal reservation={reservation} maxAmount={paymentLimit} onClose={() => setShowPayment(false)} onSaved={() => { setShowPayment(false); void load(); }} />}
    </section>
  );
}
