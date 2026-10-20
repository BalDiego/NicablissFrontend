import { useState, useEffect, useCallback } from "react";
import { foodOrderService } from "./services/foodOrder.service";
import type { FoodOrder } from "./services/types";
import "./PedidosAlimentos.css";

type EstadoPedido =
  | "Pendiente"
  | "En preparación"
  | "En camino"
  | "Entregado"
  | "Cancelado";

const estados: EstadoPedido[] = [
  "Pendiente",
  "En preparación",
  "En camino",
  "Entregado",
  "Cancelado",
];

function PedidosAlimentos() {
  const [pedidos, setPedidos] = useState<FoodOrder[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevo, setNuevo] = useState({
    huesped: "",
    habitacion: "",
    productos: "",
    total: "",
  });

  const moneda = (valor: number) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const cargarPedidos = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await foodOrderService.getAll(query);
      setPedidos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar los pedidos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPedidos(busqueda);
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda, cargarPedidos]);

  const registrarPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const total = Number(nuevo.total);
    if (!Number.isFinite(total) || total <= 0) {
      alert("Ingresa un importe válido.");
      return;
    }

    try {
      setSubmitting(true);
      await foodOrderService.create({
        huesped: nuevo.huesped.trim(),
        habitacion: nuevo.habitacion,
        productos: nuevo.productos.trim(),
        total,
      });

      setNuevo({
        huesped: "",
        habitacion: "",
        productos: "",
        total: "",
      });
      setMostrarFormulario(false);
      await cargarPedidos(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el pedido.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (id: number, estado: EstadoPedido) => {
    try {
      await foodOrderService.updateStatus(id, estado);
      await cargarPedidos(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar el estado del pedido.";
      alert(msg);
    }
  };

  const prepararMensaje = (pedido: FoodOrder) => {
    const mensaje = [
      "Nuevo pedido - Nicabliss Hotel",
      `Pedido: ${pedido.orderCode || `#PED-${pedido.id}`}`,
      `Huésped: ${pedido.huesped}`,
      `Habitación: ${pedido.habitacion}`,
      `Productos: ${pedido.productos}`,
      `Total: ${moneda(pedido.total)}`,
      "Solicitamos confirmar la preparación.",
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const pendientes = pedidos.filter((p) => p.estado === "Pendiente").length;
  const enProceso = pedidos.filter(
    (p) => p.estado === "En preparación" || p.estado === "En camino"
  ).length;
  const entregados = pedidos.filter((p) => p.estado === "Entregado").length;

  return (
    <main className="pedidos-page">
      <div className="pedidos-heading">
        <div>
          <span className="pedidos-eyebrow">
            NICABLISS / SERVICIOS
          </span>
          <h1>Pedidos de alimentos</h1>
          <p>
            Registro y seguimiento de solicitudes de huéspedes en tiempo real.
          </p>
        </div>

        <button
          type="button"
          className="pedidos-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo pedido
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
            onClick={() => cargarPedidos(busqueda)}
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

      <section className="pedidos-stats">
        <article className="pedidos-stat">
          <span>Total de pedidos</span>
          <strong>{pedidos.length}</strong>
        </article>
        <article className="pedidos-stat">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </article>
        <article className="pedidos-stat">
          <span>En proceso</span>
          <strong>{enProceso}</strong>
        </article>
        <article className="pedidos-stat">
          <span>Entregados</span>
          <strong>{entregados}</strong>
        </article>
      </section>

      <section className="pedidos-panel">
        <div className="pedidos-panel-heading">
          <div>
            <h2>Listado de pedidos</h2>
            <p>Seguimiento de alimentos solicitados con actualización instantánea</p>
          </div>

          <input
            type="search"
            placeholder="Buscar huésped o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="pedidos-table-wrap">
          <table className="pedidos-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Huésped</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>
                    <strong>{pedido.orderCode || `#PED-${pedido.id}`}</strong>
                    <small>{pedido.fecha}</small>
                  </td>
                  <td>
                    <strong>{pedido.huesped}</strong>
                    <small>{pedido.habitacion}</small>
                  </td>
                  <td>{pedido.productos}</td>
                  <td>{moneda(pedido.total)}</td>
                  <td>
                    <select
                      className="pedidos-status-select"
                      value={pedido.estado}
                      onChange={(e) =>
                        cambiarEstado(
                          pedido.id,
                          e.target.value as EstadoPedido
                        )
                      }
                    >
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pedidos-whatsapp"
                      onClick={() => prepararMensaje(pedido)}
                    >
                      Enviar por WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              Cargando pedidos...
            </p>
          )}

          {!loading && pedidos.length === 0 && (
            <p className="pedidos-empty">
              No se encontraron pedidos registrados.
            </p>
          )}
        </div>
      </section>

      <p className="pedidos-notice">
        Pedidos sincronizados en tiempo real con Nicabliss API. Al presionar Enviar por WhatsApp, se abre la conversación con los datos preformateados.
      </p>

      {mostrarFormulario && (
        <div className="pedidos-overlay">
          <div className="pedidos-modal">
            <div className="pedidos-modal-heading">
              <h2>Registrar nuevo pedido</h2>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={registrarPedido}>
              <label>Nombre del huésped</label>
              <input
                required
                value={nuevo.huesped}
                onChange={(e) =>
                  setNuevo({ ...nuevo, huesped: e.target.value })
                }
                placeholder="Nombre del huésped"
              />

              <label>Habitación</label>
              <select
                required
                value={nuevo.habitacion}
                onChange={(e) =>
                  setNuevo({ ...nuevo, habitacion: e.target.value })
                }
              >
                <option value="">Seleccionar habitación</option>
                {Array.from({ length: 14 }, (_, i) => (
                  <option
                    key={i}
                    value={`Habitación ${String(i + 1).padStart(2, "0")}`}
                  >
                    Habitación {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <label>Productos solicitados</label>
              <textarea
                required
                rows={3}
                placeholder="Ej. 2 desayunos y 1 café"
                value={nuevo.productos}
                onChange={(e) =>
                  setNuevo({ ...nuevo, productos: e.target.value })
                }
              />

              <label>Total del pedido (USD)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={nuevo.total}
                onChange={(e) =>
                  setNuevo({ ...nuevo, total: e.target.value })
                }
                placeholder="0.00"
              />

              <div className="pedidos-modal-actions">
                <button
                  type="button"
                  className="pedidos-cancel"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pedidos-primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default PedidosAlimentos;
