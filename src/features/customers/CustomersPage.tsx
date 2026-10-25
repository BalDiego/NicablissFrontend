import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeedback } from "../../hooks/useFeedback";
import { customerService, type CustomerPayload } from "../../services/customer.service";
import type { Customer } from "../../services/types";
import "../features.css";

const emptyForm: CustomerPayload = { nombre: "", apellido: "", documento: "", telefono: "", correo: "", direccion: "" };

export default function CustomersPage() {
  const navigate = useNavigate();
  const { notify } = useFeedback();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CustomerPayload>(emptyForm);

  const load = useCallback(async (term = "") => {
    setLoading(true);
    setError("");
    try {
      setCustomers(await customerService.getAll(term));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(search), 250);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await customerService.create(form);
      notify("Cliente registrado correctamente");
      setShowForm(false);
      setForm(emptyForm);
      navigate(`/customers/${created.id}`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el cliente", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div><span>RECEPCIÓN / CLIENTES</span><h1>Clientes</h1><p>Personas que reservan, se hospedan o realizan pagos.</p></div>
        <button type="button" className="feature-primary" onClick={() => setShowForm(true)}>+ Nuevo cliente</button>
      </header>
      <div className="feature-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, documento, teléfono o correo" />
      </div>
      {error && <div className="feature-error">{error}<button onClick={() => void load(search)}>Reintentar</button></div>}
      <div className="feature-panel">
        <table className="feature-table">
          <thead><tr><th>Cliente</th><th>Documento</th><th>Teléfono</th><th>Correo</th><th /></tr></thead>
          <tbody>{customers.map((customer) => (
            <tr key={customer.id}>
              <td><strong>{customer.nombre} {customer.apellido || ""}</strong></td>
              <td>{customer.documento}</td><td>{customer.telefono || "—"}</td><td>{customer.correo || "—"}</td>
              <td><button type="button" className="feature-link" onClick={() => navigate(`/customers/${customer.id}`)}>Ver detalle</button></td>
            </tr>
          ))}</tbody>
        </table>
        {loading && <p className="feature-state">Cargando clientes...</p>}
        {!loading && customers.length === 0 && <p className="feature-state">No se encontraron clientes.</p>}
      </div>

      {showForm && (
        <div className="feature-overlay" role="presentation">
          <div className="feature-modal" role="dialog" aria-modal="true">
            <header><h2>Nuevo cliente</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Cerrar">×</button></header>
            <form onSubmit={submit} className="feature-form">
              <label>Nombre *<input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label>
              <label>Apellido<input value={form.apellido || ""} onChange={(event) => setForm({ ...form, apellido: event.target.value })} /></label>
              <label>Documento *<input required value={form.documento} onChange={(event) => setForm({ ...form, documento: event.target.value })} /></label>
              <label>Teléfono<input value={form.telefono || ""} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /></label>
              <label>Correo<input type="email" value={form.correo || ""} onChange={(event) => setForm({ ...form, correo: event.target.value })} /></label>
              <label>Dirección<textarea value={form.direccion || ""} onChange={(event) => setForm({ ...form, direccion: event.target.value })} /></label>
              <footer><button type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</button><button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar cliente"}</button></footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
