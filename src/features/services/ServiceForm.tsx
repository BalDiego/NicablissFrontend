import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { serviceService } from "../../services/service.service";
import type { ServiceCatalog } from "../../services/types";

export default function ServiceForm({ stayId, catalog, onClose, onSaved }: {
  stayId: number;
  catalog: ServiceCatalog[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [serviceId, setServiceId] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = catalog.find((item) => item.id === serviceId);
  const unitPrice = overridePrice === "" ? selected?.precio ?? 0 : Number(overridePrice);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await serviceService.createConsumption(stayId, {
        serviceId,
        cantidad: quantity,
        observaciones: observations.trim() || undefined,
        ...(user?.role === "ADMIN" && overridePrice !== "" ? { precioUnitario: Number(overridePrice) } : {}),
      });
      notify("Servicio agregado a la estancia");
      onSaved();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo agregar el servicio", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feature-overlay">
      <div className="feature-modal" role="dialog" aria-modal="true">
        <header><h2>Agregar servicio</h2><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
        <form className="feature-form" onSubmit={submit}>
          <label>Servicio *<select required value={serviceId || ""} onChange={(event) => { setServiceId(Number(event.target.value)); setOverridePrice(""); }}><option value="">Seleccionar</option>{catalog.filter((item) => item.activo).map((item) => <option key={item.id} value={item.id}>{item.categoria} · {item.nombre} · ${item.precio.toFixed(2)}</option>)}</select></label>
          <label>Cantidad *<input required type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
          {user?.role === "ADMIN" && <label>Precio unitario especial (opcional)<input type="number" min="0" step="0.01" value={overridePrice} onChange={(event) => setOverridePrice(event.target.value)} placeholder={selected ? selected.precio.toFixed(2) : "0.00"} /></label>}
          <label>Observaciones<textarea rows={3} value={observations} onChange={(event) => setObservations(event.target.value)} /></label>
          <div className="feature-summary"><span>Subtotal estimado</span><strong>${(unitPrice * quantity).toFixed(2)}</strong></div>
          <footer><button type="button" onClick={onClose} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting || !serviceId}>{submitting ? "Guardando..." : "Agregar servicio"}</button></footer>
        </form>
      </div>
    </div>
  );
}
