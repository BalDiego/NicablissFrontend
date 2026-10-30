import { useState } from "react";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService } from "../../services/reservation.service";
import type { MetodoPago, Reservation } from "../../services/types";

export default function PaymentModal({ reservation, maxAmount, onClose, onSaved }: {
  reservation: Reservation;
  maxAmount?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useFeedback();
  const limit = Math.max(0, maxAmount ?? reservation.saldo);
  const [amount, setAmount] = useState(limit.toFixed(2));
  const [method, setMethod] = useState<MetodoPago>("Efectivo");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await reservationService.createPayment(reservation.id, {
        amount: Number(amount), paymentMethod: method, reference: reference.trim() || undefined,
      }, idempotencyKey);
      notify("Pago registrado y relacionado con caja");
      onSaved();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el pago", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="feature-overlay">
      <div className="feature-modal" role="dialog" aria-modal="true">
        <header><h2>Registrar pago</h2><button onClick={onClose} aria-label="Cerrar" disabled={submitting}>×</button></header>
        <form className="feature-form" onSubmit={submit}>
          <div className="feature-summary"><span>Reserva {reservation.codigoReserva}</span><strong>Saldo: ${limit.toFixed(2)}</strong></div>
          <label>Monto (USD) *<input type="number" min="0.01" max={limit} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <label>Método *<select value={method} onChange={(event) => setMethod(event.target.value as MetodoPago)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
          {method !== "Efectivo" && <label>Referencia *<input required value={reference} onChange={(event) => setReference(event.target.value)} /></label>}
          <footer><button type="button" onClick={onClose} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Procesando..." : "Confirmar pago"}</button></footer>
        </form>
      </div>
    </div>
  );
}
