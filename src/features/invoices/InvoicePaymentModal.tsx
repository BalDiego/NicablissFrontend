import { useState } from "react";
import { useFeedback } from "../../hooks/useFeedback";
import { invoiceService } from "../../services/invoice.service";
import type { Invoice, MetodoPago } from "../../services/types";

export default function InvoicePaymentModal({ invoice, onClose, onSaved }: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useFeedback();
  const [amount, setAmount] = useState(invoice.balance.toFixed(2));
  const [method, setMethod] = useState<MetodoPago>("Efectivo");
  const [reference, setReference] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await invoiceService.pay(invoice.id, {
        amount: Number(amount),
        paymentMethod: method,
        reference: reference.trim() || undefined,
      }, idempotencyKey);
      notify("Pago aplicado a la factura y registrado en caja");
      onSaved();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="feature-overlay"><div className="feature-modal" role="dialog" aria-modal="true"><header><h2>Registrar pago de factura</h2><button onClick={onClose} aria-label="Cerrar" disabled={submitting}>×</button></header><form className="feature-form" onSubmit={submit}><div className="feature-summary"><span>{invoice.invoiceNumber}</span><strong>Saldo: ${invoice.balance.toFixed(2)}</strong></div><label>Monto (USD) *<input required type="number" min="0.01" max={invoice.balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Método *<select value={method} onChange={(event) => setMethod(event.target.value as MetodoPago)}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>{method !== "Efectivo" && <label>Referencia *<input required value={reference} onChange={(event) => setReference(event.target.value)} /></label>}<footer><button type="button" onClick={onClose} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Procesando..." : "Confirmar pago"}</button></footer></form></div></div>;
}
