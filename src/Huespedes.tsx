import { useState, useEffect, useCallback } from "react";
import { guestService } from "./services/guest.service";
import type { Guest } from "./services/types";
import "./Huespedes.css";

function Huespedes() {
  const [huespedes, setHuespedes] = useState<Guest[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevo, setNuevo] = useState({
    nombre: "",
    documento: "",
    habitacion: "",
    entrada: "",
    salida: "",
  });

  const cargarHuespedes = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await guestService.getAll(query);
      setHuespedes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar los huéspedes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarHuespedes(busqueda);
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda, cargarHuespedes]);

  const registrarHuesped = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (nuevo.salida < nuevo.entrada) {
      alert("La fecha de salida no puede ser anterior a la entrada.");
      return;
    }

    try {
      setSubmitting(true);
      await guestService.create({
        nombre: nuevo.nombre.trim(),
        documento: nuevo.documento.trim(),
        habitacion: nuevo.habitacion,
        entrada: nuevo.entrada,
        salida: nuevo.salida,
        estado: "Activo",
      });

      setNuevo({
        nombre: "",
        documento: "",
        habitacion: "",
        entrada: "",
        salida: "",
      });

      setMostrarFormulario(false);
      await cargarHuespedes(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el huésped.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: "Activo" | "Finalizado" | "Reservado") => {
    try {
      await guestService.updateStatus(id, nuevoEstado);
      await cargarHuespedes(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar el estado.";
      alert(msg);
    }
  };

  const filtrados = huespedes;

  return (
    <main className="huespedes-page">
      <div className="huespedes-heading">
        <div>
          <span className="huespedes-eyebrow">
            NICABLISS / OPERACIONES
          </span>
          <h1>Huéspedes y estancias</h1>
          <p>
            Consulta y administra los huéspedes registrados en el hotel.
          </p>
        </div>

        <button
          className="huespedes-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo huésped
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            color: "#ef4444",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Error de sincronización: {error}</span>
          <button
            type="button"
            onClick={() => cargarHuespedes(busqueda)}
            style={{
              padding: "0.4rem 0.8rem",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="huespedes-stats">
        <div className="huespedes-stat">
          <span>Total de registros</span>
          <strong>{huespedes.length}</strong>
        </div>

        <div className="huespedes-stat">
          <span>Estancias activas</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Activo").length}
          </strong>
        </div>

        <div className="huespedes-stat">
          <span>Reservados</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Reservado").length}
          </strong>
        </div>

        <div className="huespedes-stat">
          <span>Finalizados</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Finalizado").length}
          </strong>
        </div>
      </div>

      <section className="huespedes-panel">
        <div className="huespedes-panel-header">
          <div>
            <h2>Listado de huéspedes</h2>
            <p>Registros en tiempo real conectados con el backend</p>
          </div>

          <input
            type="search"
            placeholder="Buscar huésped, documento o habitación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="huespedes-table-wrap">
          <table className="huespedes-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Documento</th>
                <th>Habitación</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((huesped) => (
                <tr key={huesped.id}>
                  <td className="huespedes-name">
                    <strong>{huesped.nombre}</strong>
                  </td>
                  <td>{huesped.documento}</td>
                  <td>{huesped.habitacion}</td>
                  <td>{huesped.entrada}</td>
                  <td>{huesped.salida}</td>
                  <td>
                    <span
                      className={`huespedes-status status-${huesped.estado.toLowerCase()}`}
                    >
                      {huesped.estado}
                    </span>
                  </td>
                  <td>
                    <select
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color, #334155)",
                        background: "var(--bg-surface, #1e293b)",
                        color: "inherit",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                      value={huesped.estado}
                      onChange={(e) =>
                        cambiarEstado(
                          huesped.id,
                          e.target.value as "Activo" | "Finalizado" | "Reservado"
                        )
                      }
                    >
                      <option value="Activo">Activo</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              Cargando huéspedes...
            </p>
          )}

          {!loading && filtrados.length === 0 && (
            <p className="huespedes-empty">
              No se encontraron huéspedes registrados.
            </p>
          )}
        </div>
      </section>

      {mostrarFormulario && (
        <div className="huespedes-modal-overlay">
          <div className="huespedes-modal">
            <div className="huespedes-modal-heading">
              <h2>Registrar huésped</h2>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={registrarHuesped}>
              <label>Nombre completo</label>
              <input
                required
                value={nuevo.nombre}
                onChange={(e) =>
                  setNuevo({ ...nuevo, nombre: e.target.value })
                }
                placeholder="Nombre y apellido"
              />

              <label>Documento de identidad</label>
              <input
                required
                value={nuevo.documento}
                onChange={(e) =>
                  setNuevo({ ...nuevo, documento: e.target.value })
                }
                placeholder="Cédula o Pasaporte"
              />

              <label>Habitación</label>
              <select
                required
                value={nuevo.habitacion}
                onChange={(e) =>
                  setNuevo({ ...nuevo, habitacion: e.target.value })
                }
              >
                <option value="">Selecciona una habitación</option>
                {Array.from({ length: 14 }, (_, i) => (
                  <option key={i + 1} value={`Habitación ${String(i + 1).padStart(2, "0")}`}>
                    Habitación {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <label>Fecha de entrada</label>
              <input
                type="date"
                required
                value={nuevo.entrada}
                onChange={(e) =>
                  setNuevo({ ...nuevo, entrada: e.target.value })
                }
              />

              <label>Fecha de salida</label>
              <input
                type="date"
                required
                value={nuevo.salida}
                onChange={(e) =>
                  setNuevo({ ...nuevo, salida: e.target.value })
                }
              />

              <div className="huespedes-modal-actions">
                <button
                  type="button"
                  className="huespedes-cancel"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="huespedes-primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar huésped"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Huespedes;
