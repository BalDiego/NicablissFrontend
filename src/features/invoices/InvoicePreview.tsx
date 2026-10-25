import type { Invoice } from "../../services/types";
import InvoiceItems from "./InvoiceItems";

export default function InvoicePreview({ invoice }: { invoice: Invoice }) {
  return (
    <section className="invoice-preview">
      <div className="invoice-preview-banner">COMPROBANTE INTERNO · NO ES FACTURA FISCAL</div>
      <header className="invoice-preview-header">
        <div><strong>NICABLISS</strong><span>Hotel Management</span></div>
        <div><h2>{invoice.invoiceNumber}</h2><span>{invoice.status}</span></div>
      </header>
      <div className="invoice-preview-meta">
        <div><span>Cliente</span><strong>{invoice.customerName}</strong><small>{invoice.customerDocument}</small></div>
        <div><span>Reserva</span><strong>{invoice.reservationCode}</strong><small>{invoice.room}</small></div>
        <div><span>Fecha</span><strong>{new Date(invoice.issuedAt || invoice.createdAt).toLocaleString("es-NI")}</strong><small>{invoice.issuedByName ? `Emitida por ${invoice.issuedByName}` : "Borrador"}</small></div>
      </div>
      <InvoiceItems items={invoice.items} />
      <div className="invoice-totals">
        <span>Subtotal <strong>${invoice.subtotal.toFixed(2)}</strong></span>
        <span>Impuestos <strong>${invoice.tax.toFixed(2)}</strong></span>
        <span>Descuento <strong>${invoice.discount.toFixed(2)}</strong></span>
        <span className="invoice-total">Total <strong>${invoice.total.toFixed(2)}</strong></span>
        <span className="invoice-paid">Pagado <strong>${invoice.paidAmount.toFixed(2)}</strong></span>
        <span className="invoice-balance">Saldo <strong>${invoice.balance.toFixed(2)}</strong></span>
      </div>
      {invoice.status === "Anulada" && <div className="invoice-voided"><strong>ANULADA</strong><span>{invoice.voidReason}</span></div>}
    </section>
  );
}
