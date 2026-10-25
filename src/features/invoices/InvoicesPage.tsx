import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { invoiceService } from "../../services/invoice.service";
import { stayService } from "../../services/stay.service";
import type { Invoice, InvoiceStatus, Stay } from "../../services/types";
import "../features.css";
import "./invoices.css";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [selectedStay, setSelectedStay] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvoices(await invoiceService.getAll(search, status || undefined));
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openCreate = async () => {
    setShowCreate(true);
    try { setStays((await stayService.getAll()).filter((stay) => stay.estado !== "Cancelada")); }
    catch (caught: unknown) { notify(caught instanceof Error ? caught.message : "No se pudieron cargar las estancias", "error"); }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const invoice = await invoiceService.create(Number(selectedStay));
      notify(`Borrador ${invoice.invoiceNumber} preparado`);
      navigate(`/invoices/${invoice.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo crear la factura", "error");
    } finally { setSubmitting(false); }
  };

  return <section className="feature-page"><header className="feature-heading"><div><span>FINANZAS / FACTURACIÓN</span><h1>Facturas y estados de cuenta</h1><p>Comprobantes internos consolidados de hospedaje, servicios y pagos.</p></div><button className="feature-primary" onClick={() => void openCreate()}>+ Crear desde estancia</button></header><div className="invoice-internal-notice">Documentos internos en USD, sin impuestos fiscales. No sustituyen una factura legal.</div><div className="feature-toolbar"><input placeholder="Número, reserva, cliente o documento" value={search} onChange={(event) => setSearch(event.target.value)} /><select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | "")}><option value="">Todos los estados</option>{["Borrador", "Emitida", "Parcial", "Pagada", "Anulada"].map((item) => <option key={item}>{item}</option>)}</select></div>{error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}<div className="feature-panel"><table className="feature-table"><thead><tr><th>Factura</th><th>Cliente</th><th>Reserva</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.invoiceNumber}</strong><small>{new Date(invoice.issuedAt || invoice.createdAt).toLocaleString("es-NI")}</small></td><td><strong>{invoice.customerName}</strong><small>{invoice.customerDocument}</small></td><td>{invoice.reservationCode}<small>{invoice.room}</small></td><td>${invoice.total.toFixed(2)}</td><td>${invoice.paidAmount.toFixed(2)}</td><td>${invoice.balance.toFixed(2)}</td><td><span className="feature-badge">{invoice.status}</span></td><td><button className="feature-link" onClick={() => navigate(`/invoices/${invoice.id}`)}>Ver detalle</button></td></tr>)}</tbody></table>{loading && <p className="feature-state">Cargando facturas...</p>}{!loading && invoices.length === 0 && <p className="feature-state">No hay facturas para este filtro.</p>}</div>{showCreate && <div className="feature-overlay"><div className="feature-modal"><header><h2>Crear factura desde estancia</h2><button onClick={() => setShowCreate(false)}>×</button></header><form className="feature-form" onSubmit={create}><label>Estancia *<select required value={selectedStay} onChange={(event) => setSelectedStay(event.target.value)}><option value="">Seleccionar</option>{stays.map((stay) => <option key={stay.id} value={stay.id}>{stay.customerName} · {stay.habitacion} · {stay.reservationCode} · {stay.estado}</option>)}</select></label><p>El borrador incluirá hospedaje y servicios entregados o consumidos. Se actualizará nuevamente al emitir.</p><footer><button type="button" onClick={() => setShowCreate(false)}>Cancelar</button><button className="feature-primary" disabled={submitting || !selectedStay}>{submitting ? "Preparando..." : "Crear borrador"}</button></footer></form></div></div>}</section>;
}
