import { useState } from "react";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService, type ConsumptionPayload } from "../../services/reservation.service";
import { serviceService } from "../../services/service.service";
import type {
  ConsumptionStatus,
  ReservationAccount,
  ServiceCatalog,
  ServiceConsumption,
} from "../../services/types";

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

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const emptyForm = { serviceId: 0, cantidad: 1, precioUnitario: "", observaciones: "" };

export default function ReservationConsumptions({
  account,
  catalog,
  isAdmin,
  onChanged,
}: {
  account: ReservationAccount;
  catalog: ServiceCatalog[];
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const { notify, confirm } = useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ServiceConsumption | null>(null);
  const [editForm, setEditForm] = useState({ cantidad: 1, precioUnitario: "", observaciones: "" });

  const invoiceLocked = Boolean(account.invoice && ["Emitida", "Parcial", "Pagada"].includes(account.invoice.status));
  const canEdit = account.status === "Activa" && !invoiceLocked;

  const addConsumption = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!form.serviceId) {
      notify("Selecciona un servicio del catálogo", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload: ConsumptionPayload = {
        serviceId: form.serviceId,
        cantidad: form.cantidad,
        observaciones: form.observaciones.trim() || undefined,
      };
      if (isAdmin && form.precioUnitario.trim() !== "") payload.precioUnitario = Number(form.precioUnitario);
      await reservationService.addConsumption(account.reservationId, payload);
      notify("Consumo agregado a la cuenta");
      setForm(emptyForm);
      setShowForm(false);
      onChanged();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo agregar el consumo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (consumption: ServiceConsumption, next: ConsumptionStatus) => {
    if (next === consumption.estado || updatingId !== null) return;
    setUpdatingId(consumption.id);
    try {
      await serviceService.updateStatus(consumption.id, next);
      notify("Estado del consumo actualizado");
      onChanged();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo cambiar el estado", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (consumption: ServiceConsumption) => {
    setEditing(consumption);
    setEditForm({
      cantidad: consumption.cantidad,
      precioUnitario: consumption.precioUnitario.toFixed(2),
      observaciones: consumption.observaciones || "",
    });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || submitting) return;
    if (!(await confirm("¿Guardar los cambios de este consumo?"))) return;
    setSubmitting(true);
    try {
      const payload: { cantidad: number; observaciones?: string; precioUnitario?: number } = {
        cantidad: editForm.cantidad,
        observaciones: editForm.observaciones.trim() || undefined,
      };
      if (isAdmin) payload.precioUnitario = Number(editForm.precioUnitario);
      await serviceService.updateConsumption(editing.id, payload);
      notify("Consumo actualizado");
      setEditing(null);
      onChanged();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo actualizar el consumo", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="feature-panel reservation-consumptions">
      <div className="feature-section-title">
        <div>
          <h2>Consumos de la cuenta</h2>
          <p>Servicios cargados durante la estancia. Los pendientes deben entregarse o cancelarse antes del check-out.</p>
        </div>
        {canEdit && <button type="button" className="feature-primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Cerrar formulario" : "+ Agregar consumo"}
        </button>}
      </div>

      {invoiceLocked && <p className="feature-state">La cuenta tiene una factura emitida. Anula la factura para modificar consumos.</p>}
      {catalog.some((item) => item.activo && item.precio <= 0) && (
        <p className="feature-warning" role="status">
          Hay servicios activos con precio de $0.00 en el catálogo; no añadirán importe a la cuenta. Configura su precio en el catálogo antes de cargarlos.
        </p>
      )}

      {showForm && canEdit && (
        <form onSubmit={addConsumption} className="feature-form reservation-consumption-form">
          <label>Servicio *
            <select required value={form.serviceId || ""} onChange={(event) => setForm({ ...form, serviceId: Number(event.target.value) })}>
              <option value="">Seleccionar</option>
              {catalog.filter((item) => item.activo).map((item) => (
                <option key={item.id} value={item.id}>{item.categoria} · {item.nombre} · {money(item.precio)}</option>
              ))}
            </select>
          </label>
          <label>Cantidad *<input required type="number" min="1" step="1" value={form.cantidad} onChange={(event) => setForm({ ...form, cantidad: Number(event.target.value) })} /></label>
          {isAdmin && <label>Precio unitario especial (opcional)<input type="number" min="0" step="0.01" value={form.precioUnitario} onChange={(event) => setForm({ ...form, precioUnitario: event.target.value })} /></label>}
          <label>Observaciones<input value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
          <footer className="full-column">
            <button type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</button>
            <button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Agregar consumo"}</button>
          </footer>
        </form>
      )}

      <table className="feature-table">
        <thead><tr><th>Servicio</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Estado</th><th /></tr></thead>
        <tbody>
          {account.consumptions.map((consumption) => (
            <tr key={consumption.id}>
              <td><strong>{consumption.serviceName}</strong><small>{consumption.categoria}{consumption.observaciones ? ` · ${consumption.observaciones}` : ""}</small></td>
              <td>{consumption.cantidad}</td>
              <td>{money(consumption.precioUnitario)}</td>
              <td>{money(consumption.subtotal)}</td>
              <td>
                {canEdit && transitions[consumption.estado].length > 0 ? (
                  <select
                    aria-label={`Estado de ${consumption.serviceName}`}
                    value={consumption.estado}
                    disabled={updatingId !== null}
                    onChange={(event) => void changeStatus(consumption, event.target.value as ConsumptionStatus)}
                  >
                    <option value={consumption.estado}>{statusLabels[consumption.estado]}</option>
                    {transitions[consumption.estado].map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                ) : statusLabels[consumption.estado]}
              </td>
              <td>
                {canEdit && consumption.sourceType === "DIRECT" && (
                  <button type="button" className="feature-link" onClick={() => openEdit(consumption)}>Editar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {account.consumptions.length === 0 && <p className="feature-state">Aún no hay consumos registrados en esta cuenta.</p>}

      {editing && (
        <div className="feature-overlay" role="presentation">
          <div className="feature-modal" role="dialog" aria-modal="true" aria-label="Editar consumo">
            <header><h2>Editar consumo</h2><button type="button" onClick={() => setEditing(null)} aria-label="Cerrar">×</button></header>
            <form onSubmit={saveEdit} className="feature-form">
              <label>Cantidad *<input required type="number" min="1" step="1" value={editForm.cantidad} onChange={(event) => setEditForm({ ...editForm, cantidad: Number(event.target.value) })} /></label>
              {isAdmin && <label>Precio unitario (USD) *<input required type="number" min="0" step="0.01" value={editForm.precioUnitario} onChange={(event) => setEditForm({ ...editForm, precioUnitario: event.target.value })} /></label>}
              <label>Observaciones<input value={editForm.observaciones} onChange={(event) => setEditForm({ ...editForm, observaciones: event.target.value })} /></label>
              <footer><button type="button" onClick={() => setEditing(null)} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar cambios"}</button></footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
