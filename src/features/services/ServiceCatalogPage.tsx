import { useCallback, useEffect, useState } from "react";
import { useFeedback } from "../../hooks/useFeedback";
import { serviceService, type CatalogPayload } from "../../services/service.service";
import type { ServiceCatalog, ServiceCategory } from "../../services/types";
import "../features.css";

const categories: ServiceCategory[] = ["Alimentos", "Lavandería", "Hospedaje", "Minibar", "Transporte", "Otro"];
const emptyForm: CatalogPayload = { nombre: "", categoria: "Otro", descripcion: "", precio: 0, impuesto: 0, activo: true };

export default function ServiceCatalogPage() {
  const { notify, confirm } = useFeedback();
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatalogPayload>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await serviceService.getCatalog(true));
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openForm = (service?: ServiceCatalog) => {
    setEditingId(service?.id ?? null);
    setForm(service ? {
      nombre: service.nombre,
      categoria: service.categoria,
      descripcion: service.descripcion || "",
      precio: service.precio,
      impuesto: service.impuesto,
      activo: service.activo,
    } : emptyForm);
    setShowForm(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingId) await serviceService.updateCatalog(editingId, form);
      else await serviceService.createCatalog(form);
      notify(editingId ? "Servicio actualizado" : "Servicio creado");
      setShowForm(false);
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo guardar el servicio", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (service: ServiceCatalog) => {
    if (togglingId !== null) return;
    if (!(await confirm(`¿${service.activo ? "Desactivar" : "Activar"} el servicio ${service.nombre}?`))) return;
    setTogglingId(service.id);
    try {
      await serviceService.updateCatalog(service.id, { activo: !service.activo });
      notify(service.activo ? "Servicio desactivado" : "Servicio activado");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo cambiar el servicio", "error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section className="feature-page">
      <header className="feature-heading"><div><span>CONFIGURACIÓN / SERVICIOS</span><h1>Catálogo de servicios</h1><p>Precios base y disponibilidad para consumos de estancia.</p></div><button className="feature-primary" onClick={() => openForm()}>+ Nuevo servicio</button></header>
      {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
      <div className="feature-panel"><table className="feature-table"><thead><tr><th>Servicio</th><th>Categoría</th><th>Precio</th><th>Impuesto</th><th>Estado</th><th /></tr></thead><tbody>{catalog.map((service) => <tr key={service.id}><td><strong>{service.nombre}</strong><small>{service.descripcion || "Sin descripción"}</small></td><td>{service.categoria}</td><td>${service.precio.toFixed(2)}</td><td>{service.impuesto.toFixed(2)}%</td><td>{service.activo ? "Activo" : "Inactivo"}</td><td><button className="feature-link" onClick={() => openForm(service)} disabled={togglingId !== null}>Editar</button><button className="feature-danger-link" onClick={() => void toggleActive(service)} disabled={togglingId !== null}>{togglingId === service.id ? "Guardando..." : service.activo ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table>{loading && <p className="feature-state">Cargando catálogo...</p>}</div>

      {showForm && <div className="feature-overlay"><div className="feature-modal" role="dialog" aria-modal="true"><header><h2>{editingId ? "Editar servicio" : "Nuevo servicio"}</h2><button onClick={() => setShowForm(false)} aria-label="Cerrar">×</button></header><form className="feature-form" onSubmit={submit}><label>Nombre *<input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label><label>Categoría *<select value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value as ServiceCategory })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Precio base (USD) *<input required type="number" min="0" step="0.01" value={form.precio} onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })} /></label><label>Impuesto (%)<input type="number" min="0" max="100" step="0.01" value={form.impuesto || 0} onChange={(event) => setForm({ ...form, impuesto: Number(event.target.value) })} /></label><label>Descripción<textarea value={form.descripcion || ""} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} /></label><label className="feature-checkbox"><input type="checkbox" checked={form.activo ?? true} onChange={(event) => setForm({ ...form, activo: event.target.checked })} /> Servicio activo</label><footer><button type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</button></footer></form></div></div>}
    </section>
  );
}
