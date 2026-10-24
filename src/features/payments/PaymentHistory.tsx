import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService } from "../../services/reservation.service";
import type { Payment, PaymentReceipt } from "../../services/types";

function appendLine(document: Document, label: string, value: string) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  paragraph.append(strong, document.createTextNode(value));
  document.body.appendChild(paragraph);
}

function printReceipt(receipt: PaymentReceipt) {
  const popup = window.open("", "_blank", "width=720,height=800");
  if (!popup) return;
  popup.document.title = `Comprobante ${receipt.paymentNumber}`;
  const title = popup.document.createElement("h1");
  title.textContent = "Nicabliss · Comprobante de pago";
  popup.document.body.appendChild(title);
  appendLine(popup.document, "Número", receipt.paymentNumber);
  appendLine(popup.document, "Reserva", receipt.reservationCode);
  appendLine(popup.document, "Cliente", `${receipt.customerName} · ${receipt.customerDocument}`);
  appendLine(popup.document, "Habitación", receipt.room);
  appendLine(popup.document, "Monto", `$${receipt.amount.toFixed(2)}`);
  appendLine(popup.document, "Método", receipt.paymentMethod);
  appendLine(popup.document, "Referencia", receipt.reference || "—");
  appendLine(popup.document, "Recibido por", receipt.receivedByName);
  appendLine(popup.document, "Fecha", new Date(receipt.paymentDate).toLocaleString("es-NI"));
  popup.document.close();
  popup.focus();
  popup.print();
}

export default function PaymentHistory({ payments, onChanged }: { payments: Payment[]; onChanged: () => void }) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showReceipt = async (id: number) => {
    try { printReceipt(await reservationService.getReceipt(id)); }
    catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudo generar el comprobante", "error"); }
  };

  const voidPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!voidTarget) return;
    setSubmitting(true);
    try {
      await reservationService.voidPayment(voidTarget.id, reason);
      notify("Pago anulado mediante reversión contable");
      setVoidTarget(null); setReason(""); onChanged();
    } catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudo anular el pago", "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <div className="feature-panel"><table className="feature-table"><thead><tr><th>Comprobante</th><th>Fecha</th><th>Método</th><th>Monto</th><th>Estado</th><th /></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><strong>{payment.paymentNumber}</strong>{payment.reversesPaymentId && <small>Revierte pago #{payment.reversesPaymentId}</small>}</td><td>{new Date(payment.paymentDate).toLocaleString("es-NI")}</td><td>{payment.paymentMethod}<small>{payment.reference || ""}</small></td><td className={payment.kind === "REVERSAL" ? "negative" : "positive"}>{payment.kind === "REVERSAL" ? "−" : "+"}${payment.amount.toFixed(2)}</td><td>{payment.status === "REVERSED" ? "Revertido" : "Registrado"}</td><td><button className="feature-link" onClick={() => void showReceipt(payment.id)}>Comprobante</button>{user?.role === "ADMIN" && payment.kind === "PAYMENT" && payment.status === "POSTED" && <button className="feature-danger-link" onClick={() => setVoidTarget(payment)}>Anular</button>}</td></tr>)}</tbody></table>{payments.length === 0 && <p className="feature-state">Aún no hay pagos registrados.</p>}</div>
      {voidTarget && <div className="feature-overlay"><div className="feature-modal"><header><h2>Anular pago</h2><button onClick={() => setVoidTarget(null)}>×</button></header><form className="feature-form" onSubmit={voidPayment}><p>Se creará una reversión de <strong>${voidTarget.amount.toFixed(2)}</strong>. El registro original se conservará.</p><label>Motivo *<textarea required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label><footer><button type="button" onClick={() => setVoidTarget(null)}>Cancelar</button><button className="feature-danger" disabled={submitting}>{submitting ? "Anulando..." : "Confirmar reversión"}</button></footer></form></div></div>}
    </>
  );
}
