import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { serviceService } from "../../services/service.service";
import { stayService } from "../../services/stay.service";
import { invoiceService } from "../../services/invoice.service";
import type { ServiceConsumption, Stay } from "../../services/types";
import "../features.css";

export default function StayDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [stay, setStay] = useState<Stay | null>(null);
  const [consumptions, setConsumptions] = useState<ServiceConsumption[]>([]);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const load = useCallback(async () => {
    try {
      const [stayData, consumptionData] = await Promise.all([
        stayService.getById(id),
        serviceService.getByStay(id),
      ]);
      setStay(stayData);
      setConsumptions(consumptionData);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la estancia");
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const totalServices = useMemo(
    () => consumptions.filter((item) => item.estado !== "Cancelado").reduce((sum, item) => sum + item.subtotal, 0),
    [consumptions]
  );

  const checkOut = async () => {
    if (checkingOut) return;
    if (!(await confirm("¿Confirmas el check-out? La estancia y su reserva quedarán finalizadas."))) return;
    setCheckingOut(true);
    try {
      await stayService.checkOut(id);
      notify("Check-out registrado correctamente");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el check-out", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  const createInvoice = async () => {
    if (creatingInvoice) return;
    setCreatingInvoice(true);
    try {
      const invoice = await invoiceService.create(id);
      notify(`Borrador ${invoice.invoiceNumber} preparado`);
      navigate(`/invoices/${invoice.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo preparar la factura", "error");
    } finally {
      setCreatingInvoice(false);
    }
  };

  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!stay) return <p className="feature-state">Cargando estancia...</p>;

  const canCheckOut = user?.role !== "STAFF" && stay.estado === "Activa";

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div><span>ESTANCIA / #{stay.id}</span><h1>{stay.customerName}</h1><p>{stay.habitacion} · Reserva {stay.reservationCode}</p></div>
        <div className="feature-actions">
          <Link className="feature-primary" to={`/stays/${stay.id}/services`}>Gestionar servicios</Link>
          {stay.estado !== "Cancelada" && <button type="button" onClick={() => void createInvoice()} disabled={creatingInvoice || checkingOut}>{creatingInvoice ? "Preparando..." : "Ver cuenta / facturar"}</button>}
          {canCheckOut && <button type="button" onClick={() => void checkOut()} disabled={checkingOut || creatingInvoice}>{checkingOut ? "Finalizando..." : "Registrar check-out"}</button>}
        </div>
      </header>

      <div className="feature-detail-grid">
        <article><span>Estado</span><strong>{stay.estado}</strong></article>
        <article><span>Check-in</span><strong>{new Date(stay.checkInAt).toLocaleString("es-NI")}</strong></article>
        <article><span>Servicios registrados</span><strong>{consumptions.length}</strong></article>
        <article><span>Total servicios</span><strong>${totalServices.toFixed(2)}</strong></article>
        <article><span>Documento</span><strong>{stay.customerDocument}</strong></article>
        <article><span>Check-out</span><strong>{stay.checkOutAt ? new Date(stay.checkOutAt).toLocaleString("es-NI") : "Pendiente"}</strong></article>
      </div>

      <div className="feature-section-title"><h2>Últimos consumos</h2><p>Incluye cargos directos, alimentos y lavandería.</p></div>
      <div className="feature-panel">
        <table className="feature-table">
          <thead><tr><th>Servicio</th><th>Origen</th><th>Cantidad</th><th>Subtotal</th><th>Estado</th></tr></thead>
          <tbody>{consumptions.slice(0, 8).map((item) => <tr key={item.id}><td><strong>{item.serviceName}</strong><small>{item.categoria}</small></td><td>{item.sourceType === "DIRECT" ? "Directo" : item.sourceType === "FOOD_ORDER" ? "Alimentos" : "Lavandería"}</td><td>{item.cantidad}</td><td>${item.subtotal.toFixed(2)}</td><td>{item.estado}</td></tr>)}</tbody>
        </table>
        {consumptions.length === 0 && <p className="feature-state">No hay servicios registrados.</p>}
      </div>
      <Link className="feature-link" to="/stays">← Volver a estancias</Link>
    </section>
  );
}
