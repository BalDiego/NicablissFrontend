
import { useState } from "react";
import "./PedidosAlimentos.css";

type EstadoPedido =
  | "Pendiente"
  | "En preparación"
  | "En camino"
  | "Entregado"
  | "Cancelado";

type Pedido = {
  id: number;
  huesped: string;
  habitacion: string;
  productos: string;
  total: number;
  estado: EstadoPedido;
  fecha: string;
};

const pedidosIniciales: Pedido[] = [
  {
    id: 101,
    huesped: "María González",
    habitacion: "Habitación 01",
    productos: "2 desayunos americanos",
    total: 12,
    estado: "Pendiente",
    fecha: "19/10/2026",
  },
  {
    id: 102,
    huesped: "Carlos Mendoza",
    habitacion: "Habitación 04",
    productos: "1 sándwich y 1 café",
    total: 7.5,
    estado: "En preparación",
    fecha: "19/10/2026",
  },
  {
    id: 103,
    huesped: "Sophie Laurent",
    habitacion: "Habitación 07",
    productos: "1 desayuno continental",
    total: 6,
    estado: "Entregado",
    fecha: "19/10/2026",
  },
];

const estados: EstadoPedido[] = [
  "Pendiente",
  "En preparación",
  "En camino",
  "Entregado",
  "Cancelado",
];

function PedidosAlimentos() {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [busqueda, setBusqueda] = useState("");
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

  const pedidosFiltrados = pedidos.filter((pedido) =>
    `${pedido.huesped} ${pedido.habitacion} ${pedido.productos}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const registrarPedido = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const total = Number(nuevo.total);
    if (!Number.isFinite(total) || total <= 0) {
      alert("Ingresa un importe válido.");
      return;
    }

    const pedido: Pedido = {
      id: Date.now(),
      huesped: nuevo.huesped.trim(),
      habitacion: nuevo.habitacion,
      productos: nuevo.productos.trim(),
      total,
      estado: "Pendiente",
      fecha: new Date().toLocaleDateString("es-NI"),
    };

    setPedidos((anteriores) => [pedido, ...anteriores]);
    setNuevo({
      huesped: "",
      habitacion: "",
      productos: "",
      total: "",
    });
    setMostrarFormulario(false);
  };

  const cambiarEstado = (id: number, estado: EstadoPedido) => {
    setPedidos((anteriores) =>
      anteriores.map((pedido) =>
        pedido.id === id ? { ...pedido, estado } : pedido
      )
    );
  };

  const prepararMensaje = (pedido: Pedido) => {
    const mensaje = [
      "Nuevo pedido - Nicabliss",
      `Pedido: #${pedido.id}`,
      `Huésped: ${pedido.huesped}`,
      `Habitación: ${pedido.habitacion}`,
      `Productos: ${pedido.productos}`,
      `Total: ${moneda(pedido.total)}`,
      "Solicitamos confirmar la preparación.",
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const pendientes = pedidos.filter(
    (p) => p.estado === "Pendiente"
  ).length;

  const enProceso = pedidos.filter(
    (p) => p.estado === "En preparación" || p.estado === "En camino"
  ).length;

  const entregados = pedidos.filter(
    (p) => p.estado === "Entregado"
  ).length;

  return (
    <main className="pedidos-page">
      <div className="pedidos-heading">
        <div>
          <span className="pedidos-eyebrow">
            NICABLISS / SERVICIOS
          </span>
          <h1>Pedidos de alimentos</h1>
          <p>
            Registro y seguimiento de solicitudes de huéspedes.
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
            <p>Seguimiento de alimentos solicitados a Villalobos</p>
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
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id}>
                  <td>
                    <strong>#{pedido.id}</strong>
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

          {pedidosFiltrados.length === 0 && (
            <p className="pedidos-empty">
              No se encontraron pedidos.
            </p>
          )}
        </div>
      </section>

      <p className="pedidos-notice">
        Los pedidos son de demostración. WhatsApp se abre con
        el mensaje preparado, pero el envío debe confirmarse
        manualmente.
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
                ✕
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
              />

              <div className="pedidos-modal-actions">
                <button
                  type="button"
                  className="pedidos-cancel"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="pedidos-primary">
                  Guardar pedido
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
