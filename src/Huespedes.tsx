import { useState, useEffect, useCallback } from "react";
import { guestService } from "./services/guest.service";
import type { Guest } from "./services/types";
import "./Huespedes.css";

function Huespedes() {
  const [huespedes, setHuespedes] = useState<Guest[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Activo" | "Reservado" | "Finalizado">("Todos");
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

  // Filtrado local según la pestaña seleccionada
  const filtrados = huespedes.filter((h) => {
    if (filtroEstado !== "Todos" && h.estado !== filtroEstado) {
      return false;
    }
    return true;
  });

  const totalActivos = huespedes.filter((h) => h.estado === "Activo").length;
  const totalReservados = huespedes.filter((h) => h.estado === "Reservado").length;
  const totalFinalizados = huespedes.filter((h) => h.estado === "Finalizado").length;

  return (
    <main className="huespedes-page">
      {/* Encabezado */}
      <div className="huespedes-heading">
        <div>
          <span className="huespedes-eyebrow">NICABLISS / OPERACIONES</span>
          <h1>Huéspedes y estancias</h1>
          <p>
            Consulta, filtra y administra los huéspedes registrados en el hotel en tiempo real.
          </p>
        </div>

        <button
          className="huespedes-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          <span>+</span> Nuevo huésped
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

      {/* Tarjetas KPI Interactivas con Clic */}
      <div className="huespedes-stats">
        <div
          className={`huespedes-stat ${filtroEstado === "Todos" ? "is-active" : ""}`}
          onClick={() => setFiltroEstado("Todos")}
          title="Ver todos los registros"
        >
          <span>Total de registros</span>
          <strong>{huespedes.length}</strong>
        </div>

        <div
          className={`huespedes-stat ${filtroEstado === "Activo" ? "is-active" : ""}`}
          onClick={() => setFiltroEstado("Activo")}
          title="Filtrar por estancias activas"
        >
          <span>Estancias activas</span>
          <strong style={{ color: "#16a34a" }}>{totalActivos}</strong>
        </div>

        <div
          className={`huespedes-stat ${filtroEstado === "Reservado" ? "is-active" : ""}`}
          onClick={() => setFiltroEstado("Reservado")}
          title="Filtrar por reservaciones"
        >
          <span>Reservados</span>
          <strong style={{ color: "#2563eb" }}>{totalReservados}</strong>
        </div>

        <div
          className={`huespedes-stat ${filtroEstado === "Finalizado" ? "is-active" : ""}`}
          onClick={() => setFiltroEstado("Finalizado")}
          title="Filtrar por estancias finalizadas"
        >
          <span>Finalizados</span>
          <strong style={{ color: "#64748b" }}>{totalFinalizados}</strong>
        </div>
      </div>

      {/* Panel con Barra de Búsqueda y Pestañas de Filtro */}
      <section className="huespedes-panel">
        <div className="huespedes-panel-header">
          <div className="huespedes-toolbar">
            <div className="huespedes-search-box">
              <span className="huespedes-search-icon">🔍</span>
              <input
                type="search"
                placeholder="Buscar por nombre, documento o habitación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* Pestañas de Filtro Claras y Visibles */}
            <div className="huespedes-filter-tabs">
              <button
                type="button"
                className={`huespedes-tab-btn ${filtroEstado === "Todos" ? "is-active" : ""}`}
                onClick={() => setFiltroEstado("Todos")}
              >
                Todos ({huespedes.length})
              </button>
              <button
                type="button"
                className={`huespedes-tab-btn tab-activo ${filtroEstado === "Activo" ? "is-active" : ""}`}
                onClick={() => setFiltroEstado("Activo")}
              >
                🟢 Activos ({totalActivos})
              </button>
              <button
                type="button"
                className={`huespedes-tab-btn tab-reservado ${filtroEstado === "Reservado" ? "is-active" : ""}`}
                onClick={() => setFiltroEstado("Reservado")}
              >
                🔵 Reservados ({totalReservados})
              </button>
              <button
                type="button"
                className={`huespedes-tab-btn tab-finalizado ${filtroEstado === "Finalizado" ? "is-active" : ""}`}
                onClick={() => setFiltroEstado("Finalizado")}
              >
                ⚪ Finalizados ({totalFinalizados})
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="huespedes-table-wrap">
          <table className="huespedes-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Documento</th>
                <th>Habitación</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado Actual</th>
                <th>Cambiar Estado</th>
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
                      {huesped.estado === "Activo" && "🟢 "}
                      {huesped.estado === "Reservado" && "🔵 "}
                      {huesped.estado === "Finalizado" && "⚪ "}
                      {huesped.estado}
                    </span>
                  </td>
                  <td>
                    <select
                      className="huespedes-action-select"
                      value={huesped.estado}
                      onChange={(e) =>
                        cambiarEstado(
                          huesped.id,
                          e.target.value as "Activo" | "Finalizado" | "Reservado"
                        )
                      }
                      title="Cambiar estado de estancia del huésped"
                      aria-label="Cambiar estado"
                    >
                      <option value="Activo">✓ Activo</option>
                      <option value="Reservado">⏳ Reservado</option>
                      <option value="Finalizado">🏁 Finalizado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
              Cargando huéspedes...
            </p>
          )}

          {!loading && filtrados.length === 0 && (
            <p className="huespedes-empty">
              No se encontraron huéspedes con los filtros actuales.
            </p>
          )}
        </div>
      </section>

      {/* Modal Registrar Huésped */}
      {mostrarFormulario && (
        <div className="huespedes-modal-overlay" onClick={() => !submitting && setMostrarFormulario(false)}>
          <div className="huespedes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="huespedes-modal-heading">
              <h2>Registrar nuevo huésped</h2>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                title="Cerrar ventana"
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <form onSubmit={registrarHuesped}>
              <label>Nombre completo *</label>
              <input
                required
                value={nuevo.nombre}
                onChange={(e) =>
                  setNuevo({ ...nuevo, nombre: e.target.value })
                }
                placeholder="Nombre y apellido"
              />

              <label>Documento de identidad *</label>
              <input
                required
                value={nuevo.documento}
                onChange={(e) =>
                  setNuevo({ ...nuevo, documento: e.target.value })
                }
                placeholder="Cédula o Pasaporte"
              />

              <label>Habitación asignada *</label>
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

              <label>Fecha de entrada *</label>
              <input
                type="date"
                required
                value={nuevo.entrada}
                onChange={(e) =>
                  setNuevo({ ...nuevo, entrada: e.target.value })
                }
              />

              <label>Fecha de salida *</label>
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
