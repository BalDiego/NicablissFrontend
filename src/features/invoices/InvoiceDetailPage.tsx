import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { invoiceService } from "../../services/invoice.service";
import { reservationService } from "../../services/reservation.service";
import type { Invoice, Payment } from "../../services/types";
import PaymentHistory from "../payments/PaymentHistory";
import InvoicePaymentModal from "./InvoicePaymentModal";
import InvoicePreview from "./InvoicePreview";
import "../features.css";
import "./invoices.css";

export default function InvoiceDetailPage() {
  const id = Number(useParams().id);
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const invoiceData = await invoiceService.getById(id);
      const paymentData = await reservationService.getPayments(invoiceData.reservationId);
      setInvoice(invoiceData);
      setPayments(paymentData);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la factura");
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const issue = async () => {
    if (submitting) return;
    if (!(await confirm("¿Emitir este comprobante? Sus líneas y precios quedarán congelados."))) return;
    setSubmitting(true);
    try {
      await invoiceService.issue(id);
      notify("Factura interna emitida");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo emitir la factura", "error");
    } finally { setSubmitting(false); }
  };

  const download = async () => {
    if (!invoice) return;
    try {
      const blob = await invoiceService.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo descargar el PDF", "error");
    }
  };

  const voidInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await invoiceService.void(id, voidReason);
      notify("Factura anulada; los pagos se conservaron sin aplicación");
      setShowVoid(false);
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo anular la factura", "error");
    } finally { setSubmitting(false); }
  };

  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!invoice) return <p className="feature-state">Cargando factura...</p>;

  return <section className="feature-page invoice-detail-page"><header className="feature-heading no-print"><div><span>FACTURA / {invoice.invoiceNumber}</span><h1>{invoice.customerName}</h1><p>{invoice.reservationCode} · {invoice.room}</p></div><div className="feature-actions">{invoice.status === "Borrador" && <button className="feature-primary" onClick={() => void issue()} disabled={submitting}>Emitir</button>}{["Emitida", "Parcial"].includes(invoice.status) && invoice.balance > 0 && <button className="feature-primary" onClick={() => setShowPayment(true)} disabled={submitting}>Registrar pago</button>}<button onClick={() => void download()} disabled={submitting}>Descargar PDF</button><button onClick={() => window.print()} disabled={submitting}>Imprimir</button>{user?.role === "ADMIN" && invoice.status !== "Anulada" && <button className="feature-danger" onClick={() => setShowVoid(true)} disabled={submitting}>Anular</button>}</div></header><InvoicePreview invoice={invoice} /><div className="feature-section-title no-print"><h2>Pagos de la reserva</h2><p>Anticipos, abonos y reversiones vinculados al mismo flujo financiero.</p></div><div className="no-print"><PaymentHistory payments={payments} onChanged={() => void load()} /></div><Link className="feature-link no-print" to="/invoices">← Volver a facturas</Link>{showPayment && <InvoicePaymentModal invoice={invoice} onClose={() => setShowPayment(false)} onSaved={() => { setShowPayment(false); void load(); }} />}{showVoid && <div className="feature-overlay"><div className="feature-modal"><header><h2>Anular factura</h2><button onClick={() => setShowVoid(false)} disabled={submitting}>×</button></header><form className="feature-form" onSubmit={voidInvoice}><p>La factura quedará anulada, pero los pagos y movimientos de caja no se eliminarán.</p><label>Motivo *<textarea required minLength={3} value={voidReason} onChange={(event) => setVoidReason(event.target.value)} /></label><footer><button type="button" onClick={() => setShowVoid(false)} disabled={submitting}>Cancelar</button><button className="feature-danger" disabled={submitting}>{submitting ? "Anulando..." : "Confirmar anulación"}</button></footer></form></div></div>}</section>;
}
