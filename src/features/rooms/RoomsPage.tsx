import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { roomService, type RoomPayload } from "../../services/room.service";
import type { Room } from "../../services/types";
import "../features.css";

const emptyForm: RoomPayload = {
  code: "",
  name: "",
  category: "Estándar",
  description: "",
  pricePerNight: 0,
  active: true,
};

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function RoomsPage() {
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const isAdmin = user?.role === "ADMIN";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomPayload>(emptyForm);
  const [pricePerNightInput, setPricePerNightInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRooms(await roomService.getAll());
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar las habitaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openForm = (room?: Room) => {
    setEditingId(room?.id ?? null);
    setForm(room ? {
      code: room.code,
      name: room.name,
      category: room.category || "Estándar",
      description: room.description || "",
      pricePerNight: room.pricePerNight,
      active: room.active,
    } : emptyForm);
    setPricePerNightInput(room && room.pricePerNight > 0 ? String(room.pricePerNight) : "");
    setShowForm(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const normalizedPrice = pricePerNightInput.trim().replace(",", ".");
    const price = Number(normalizedPrice);
    if (!/^\d+(?:\.\d{0,2})?$/.test(normalizedPrice) || !Number.isFinite(price) || price <= 0) {
      notify("Ingresa un precio por noche mayor que $0.00, con hasta dos decimales", "error");
      return;
    }
    const priceCents = Math.round(price * 100);
    if (!Number.isSafeInteger(priceCents) || priceCents <= 0) {
      notify("El precio por noche no es válido", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, pricePerNight: priceCents / 100 };
      if (editingId) await roomService.update(editingId, payload);
      else await roomService.create(payload);
      notify(editingId ? "Habitación actualizada" : "Habitación creada");
      setShowForm(false);
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo guardar la habitación", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (room: Room) => {
    if (togglingId !== null) return;
    if (!(await confirm(`¿${room.active ? "Desactivar" : "Activar"} la habitación ${room.name}?`))) return;
    setTogglingId(room.id);
    try {
      await roomService.update(room.id, { active: !room.active });
      notify(room.active ? "Habitación desactivada" : "Habitación activada");
      await load();
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo cambiar la habitación", "error");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div>
          <span>CONFIGURACIÓN / HABITACIONES</span>
          <h1>Habitaciones</h1>
          <p>Nombre, categoría, precio por noche y disponibilidad. El precio queda congelado en cada reserva.</p>
        </div>
        {isAdmin && <button type="button" className="feature-primary" onClick={() => openForm()}>+ Nueva habitación</button>}
      </header>

      {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
      {!loading && rooms.some((room) => room.active && room.pricePerNight <= 0) && (
        <p className="feature-warning" role="status">
          Hay habitaciones activas con precio de $0.00 por noche. Configura su tarifa antes de crear reservas para que el total se calcule correctamente.
        </p>
      )}

      <div className="feature-panel">
        <table className="feature-table">
          <thead>
            <tr><th>Habitación</th><th>Categoría</th><th>Precio por noche</th><th>Estado</th><th>Disponibilidad</th><th /></tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td><strong>{room.name}</strong><small>Código {room.code}{room.description ? ` · ${room.description}` : ""}</small></td>
                <td>{room.category || "—"}</td>
                <td>{money(room.pricePerNight)}</td>
                <td>{room.active ? "Activa" : "Inactiva"}</td>
                <td>{room.active ? (room.available === false ? "Ocupada" : "Disponible") : "No disponible"}</td>
                <td>
                  {isAdmin && (
                    <>
                      <button className="feature-link" onClick={() => openForm(room)} disabled={togglingId !== null}>Editar</button>
                      <button className="feature-danger-link" onClick={() => void toggleActive(room)} disabled={togglingId !== null}>
                        {togglingId === room.id ? "Guardando..." : room.active ? "Desactivar" : "Activar"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="feature-state">Cargando habitaciones...</p>}
        {!loading && rooms.length === 0 && <p className="feature-state">No hay habitaciones registradas.</p>}
      </div>

      {showForm && (
        <div className="feature-overlay" role="presentation">
          <div className="feature-modal" role="dialog" aria-modal="true" aria-label="Habitación">
            <header>
              <h2>{editingId ? "Editar habitación" : "Nueva habitación"}</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Cerrar">×</button>
            </header>
            <form onSubmit={submit} className="feature-form">
              <label>Código *<input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
              <label>Nombre *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Categoría *<input required value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} list="room-categories" /><datalist id="room-categories"><option value="Estándar" /><option value="Superior" /><option value="Deluxe" /><option value="Suite" /><option value="Familiar" /></datalist></label>
              <label>Precio por noche (USD) *<input type="text" inputMode="decimal" placeholder="0.00" value={pricePerNightInput} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setPricePerNightInput(event.target.value)} /></label>
              <label className="full-column">Descripción<textarea rows={3} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label className="feature-checkbox"><input type="checkbox" checked={form.active ?? true} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Habitación activa</label>
              <footer>
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</button>
                <button className="feature-primary" disabled={submitting}>{submitting ? "Guardando..." : "Guardar habitación"}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
