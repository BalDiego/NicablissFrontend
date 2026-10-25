import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { serviceService } from "../../services/service.service";
import { stayService } from "../../services/stay.service";
import type { ConsumptionStatus, ServiceCatalog, ServiceConsumption, Stay } from "../../services/types";
import ServiceForm from "./ServiceForm";
import "../features.css";

const transitions: Record<ConsumptionStatus, ConsumptionStatus[]> = {
  Registrado: ["EnProceso", "Entregado", "Consumido", "Cancelado"],
  EnProceso: ["Entregado", "Consumido", "Cancelado"],
  Entregado: ["Consumido", "Cancelado"],
  Consumido: [],
  Cancelado: [],
};

const statusLabels: Record<ConsumptionStatus, string> = {
  Registrado: "Registrado",
  EnProceso: "En proceso",
  Entregado: "Entregado",
  Consumido: "Consumido",
  Cancelado: "Cancelado",
};

export default function StayServicesPage() {
  const stayId = Number(useParams().id);
  const { notify } = useFeedback();
  const [stay, setStay] = useState<Stay | null>(null);
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [consumptions, setConsumptions] = useState<ServiceConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stayData, catalogData, consumptionData] = await Promise.all([
        stayService.getById(stayId),
        serviceService.getCatalog(),
        serviceService.getByStay(stayId),
      ]);
      setStay(stayData);
      setCatalog(catalogData);
      setConsumptions(consumptionData);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [stayId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const total = useMemo(
    () => consumptions.filter((item) => item.estado !== "Cancelado").reduce((sum, item) => sum + item.subtotal, 0),
    [consumptions]
  );

  const updateStatus = async (id: number, estado: ConsumptionStatus) => {
    try {
      await serviceService.updateStatus(id, estado);
      notify("Estado del servicio actualizado");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo actualizar el servicio", "error");
    }
  };

  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!stay) return <p className="feature-state">Cargando servicios...</p>;

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div><span>ESTANCIA #{stay.id} / SERVICIOS</span><h1>Consumos de {stay.customerName}</h1><p>{stay.habitacion} · {stay.reservationCode}</p></div>
        {stay.estado === "Activa" && <button className="feature-primary" onClick={() => setShowForm(true)}>+ Agregar servicio</button>}
      </header>

      <div className="feature-detail-grid">
        <article><span>Estado de estancia</span><strong>{stay.estado}</strong></article>
        <article><span>Consumos</span><strong>{consumptions.length}</strong></article>
        <article><span>Total activo</span><strong>${total.toFixed(2)}</strong></article>
        <article><span>Pendientes</span><strong>{consumptions.filter((item) => ["Registrado", "EnProceso"].includes(item.estado)).length}</strong></article>
      </div>

      <div className="feature-panel">
        <table className="feature-table">
          <thead><tr><th>Servicio</th><th>Origen</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Estado</th></tr></thead>
          <tbody>{consumptions.map((item) => {
            const allowed = transitions[item.estado];
            return <tr key={item.id}>
              <td><strong>{item.serviceName}</strong><small>{item.observaciones || item.categoria}</small></td>
              <td>{item.sourceType === "DIRECT" ? "Directo" : item.sourceType === "FOOD_ORDER" ? `Pedido #${item.sourceId}` : `Lavandería #${item.sourceId}`}</td>
              <td>{item.cantidad}</td><td>${item.precioUnitario.toFixed(2)}</td><td><strong>${item.subtotal.toFixed(2)}</strong></td>
              <td><select value={item.estado} disabled={stay.estado !== "Activa" || allowed.length === 0} onChange={(event) => void updateStatus(item.id, event.target.value as ConsumptionStatus)}><option value={item.estado}>{statusLabels[item.estado]}</option>{allowed.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td>
            </tr>;
          })}</tbody>
        </table>
        {loading && <p className="feature-state">Actualizando servicios...</p>}
        {!loading && consumptions.length === 0 && <p className="feature-state">No hay consumos registrados.</p>}
      </div>

      <Link className="feature-link" to={`/stays/${stay.id}`}>← Volver a la estancia</Link>
      {showForm && <ServiceForm stayId={stay.id} catalog={catalog} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
    </section>
  );
}
