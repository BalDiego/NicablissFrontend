import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService } from "../../services/reservation.service";
import type { Payment, Reservation, ReservationStatus } from "../../services/types";
import PaymentHistory from "../payments/PaymentHistory";
import PaymentModal from "../payments/PaymentModal";
import "../features.css";

export default function ReservationDetailPage() {
  const id = Number(useParams().id);
  const { notify } = useFeedback();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reservationData, paymentData] = await Promise.all([
        reservationService.getById(id), reservationService.getPayments(id),
      ]);
      setReservation(reservationData); setPayments(paymentData); setError("");
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudo cargar la reserva"); }
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const changeStatus = async (status: ReservationStatus) => {
    try { await reservationService.updateStatus(id, status); notify("Estado actualizado"); await load(); }
    catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudo actualizar", "error"); }
  };

  if (error) return <div className="feature-error">{error}</div>;
  if (!reservation) return <p className="feature-state">Cargando reserva...</p>;

  return (
    <section className="feature-page">
      <header className="feature-heading"><div><span>RESERVA / {reservation.codigoReserva}</span><h1>{reservation.customerName}</h1><p>{reservation.habitacion} · {reservation.fechaEntrada} al {reservation.fechaSalida}</p></div><div className="feature-actions">{reservation.saldo > 0 && ["Pendiente", "Confirmada", "CheckIn"].includes(reservation.estado) && <button className="feature-primary" onClick={() => setShowPayment(true)}>Registrar pago</button>}{["Pendiente", "Confirmada"].includes(reservation.estado) && <button onClick={() => void changeStatus("Cancelada")}>Cancelar reserva</button>}</div></header>
      <div className="feature-detail-grid"><article><span>Total</span><strong>${reservation.totalReserva.toFixed(2)}</strong></article><article><span>Anticipo requerido</span><strong>${reservation.depositoRequerido.toFixed(2)}</strong></article><article><span>Abonado</span><strong>${reservation.abonado.toFixed(2)}</strong></article><article><span>Saldo</span><strong>${reservation.saldo.toFixed(2)}</strong></article><article><span>Estado</span><strong>{reservation.estado}</strong></article><article><span>Documento</span><strong>{reservation.customerDocument}</strong></article></div>
      <div className="feature-section-title"><div><h2>Historial de pagos</h2><p>Cada abono y reversión se conserva individualmente.</p></div></div>
      <PaymentHistory payments={payments} onChanged={() => void load()} />
      <Link className="feature-link" to="/reservations">← Volver a reservas</Link>
      {showPayment && <PaymentModal reservation={reservation} onClose={() => setShowPayment(false)} onSaved={() => { setShowPayment(false); void load(); }} />}
    </section>
  );
}
