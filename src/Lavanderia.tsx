
import { useState } from "react";
import "./Lavanderia.css";

// Tarifa provisional.
// Posteriormente se obtendrá del catálogo de servicios.
const PRECIO_POR_PRENDA = 0.5;

const TIPOS_PRENDA = [
  "Camisa",
  "Camiseta",
  "Pantalón",
  "Short",
  "Vestido",
  "Falda",
  "Ropa interior",
  "Par de calcetines",
  "Toalla",
  "Suéter",
  "Chaqueta",
  "Otra prenda",
] as const;

type TipoPrenda = (typeof TIPOS_PRENDA)[number];

type EstadoLavanderia =
  | "Pendiente"
  | "En proceso"
  | "Listo"
  | "Entregado"
  | "Cancelado";

type DetallePrenda = {
  tipo: TipoPrenda;
  cantidad: number;
};

type SolicitudLavanderia = {
  id: number;
  huesped: string;
  habitacion: string;
  prendas: DetallePrenda[];
  totalPrendas: number;
  total: number;
  estado: EstadoLavanderia;
  fecha: string;
  observaciones: string;
};

const estados: EstadoLavanderia[] = [
  "Pendiente",
  "En proceso",
  "Listo",
  "Entregado",
  "Cancelado",
];

const solicitudesIniciales: SolicitudLavanderia[] = [
  {
    id: 1001,
    huesped: "María González",
    habitacion: "Habitación 01",
    prendas: [
      { tipo: "Camisa", cantidad: 2 },
      { tipo: "Pantalón", cantidad: 1 },
      { tipo: "Par de calcetines", cantidad: 2 },
    ],
    totalPrendas: 5,
    total: 2.5,
    estado: "Pendiente",
    fecha: "19/10/2026",
    observaciones: "Entregar en recepción",
  },
  {
    id: 1002,
    huesped: "Carlos Mendoza",
    habitacion: "Habitación 04",
    prendas: [
      { tipo: "Camiseta", cantidad: 3 },
      { tipo: "Short", cantidad: 1 },
    ],
    totalPrendas: 4,
    total: 2,
    estado: "En proceso",
    fecha: "19/10/2026",
    observaciones: "",
  },
  {
    id: 1003,
    huesped: "Sophie Laurent",
    habitacion: "Habitación 07",
    prendas: [
      { tipo: "Vestido", cantidad: 1 },
      { tipo: "Par de calcetines", cantidad: 1 },
    ],
    totalPrendas: 2,
    total: 1,
    estado: "Entregado",
    fecha: "19/10/2026",
    observaciones: "",
  },
];

const crearDetalleVacio = (): DetallePrenda[] => [
  { tipo: "Camisa", cantidad: 1 },
];

function Lavanderia() {
  const [solicitudes, setSolicitudes] = useState(
    solicitudesIniciales
  );

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [nuevo, setNuevo] = useState({
    huesped: "",
    habitacion: "",
    observaciones: "",
  });

  const [prendasNuevas, setPrendasNuevas] =
    useState<DetallePrenda[]>(crearDetalleVacio);

  const moneda = (valor: number) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const cantidadTotal = prendasNuevas.reduce(
    (suma, prenda) => suma + prenda.cantidad,
    0
  );

  const totalNuevo = cantidadTotal * PRECIO_POR_PRENDA;

  const pendientes = solicitudes.filter(
    (s) => s.estado === "Pendiente"
  ).length;

  const enProceso = solicitudes.filter(
    (s) => s.estado === "En proceso"
  ).length;

  const listas = solicitudes.filter(
    (s) => s.estado === "Listo"
  ).length;

  const entregadas = solicitudes.filter(
    (s) => s.estado === "Entregado"
  ).length;

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const coincideBusqueda =
      `${s.huesped} ${s.habitacion} ${s.id}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "Todos" ||
      s.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const agregarPrenda = () => {
    setPrendasNuevas((anteriores) => [
      ...anteriores,
      { tipo: "Camisa", cantidad: 1 },
    ]);
  };

  const actualizarPrenda = (
    indice: number,
    campo: "tipo" | "cantidad",
    valor: string | number
  ) => {
    setPrendasNuevas((anteriores) =>
      anteriores.map((prenda, i) => {
        if (i !== indice) return prenda;

        if (campo === "tipo") {
          return {
            ...prenda,
            tipo: valor as TipoPrenda,
          };
        }

        return {
          ...prenda,
          cantidad: Number(valor),
        };
      })
    );
  };

  const eliminarPrenda = (indice: number) => {
    setPrendasNuevas((anteriores) =>
      anteriores.filter((_, i) => i !== indice)
    );
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setNuevo({
      huesped: "",
      habitacion: "",
      observaciones: "",
    });
    setPrendasNuevas(crearDetalleVacio());
  };

  const registrarSolicitud = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!nuevo.huesped.trim() || !nuevo.habitacion) {
      alert("Completa los datos del huésped.");
      return;
    }

    if (
      prendasNuevas.length === 0 ||
      prendasNuevas.some(
        (p) =>
          !Number.isInteger(p.cantidad) ||
          p.cantidad < 1
      )
    ) {
      alert("Agrega prendas con cantidades válidas.");
      return;
    }

    // Agrupar prendas repetidas.
    const agrupadas = prendasNuevas.reduce<DetallePrenda[]>(
      (resultado, prenda) => {
        const existente = resultado.find(
          (item) => item.tipo === prenda.tipo
        );

        if (existente) {
          existente.cantidad += prenda.cantidad;
        } else {
          resultado.push({ ...prenda });
        }

        return resultado;
      },
      []
    );

    const cantidad = agrupadas.reduce(
      (suma, prenda) => suma + prenda.cantidad,
      0
    );

    const solicitud: SolicitudLavanderia = {
      id: Date.now(),
      huesped: nuevo.huesped.trim(),
      habitacion: nuevo.habitacion,
      prendas: agrupadas,
      totalPrendas: cantidad,
      total: cantidad * PRECIO_POR_PRENDA,
      estado: "Pendiente",
      fecha: new Date().toLocaleDateString("es-NI"),
      observaciones: nuevo.observaciones.trim(),
    };

    setSolicitudes((anteriores) => [
      solicitud,
      ...anteriores,
    ]);

    cerrarFormulario();
  };

  const cambiarEstado = (
    id: number,
    estado: EstadoLavanderia
  ) => {
    setSolicitudes((anteriores) =>
      anteriores.map((solicitud) =>
        solicitud.id === id
          ? { ...solicitud, estado }
          : solicitud
      )
    );
  };

  return (
    <main className="lavanderia-page">
      <div className="lavanderia-heading">
        <div>
          <span className="lavanderia-eyebrow">
            NICABLISS / SERVICIOS
          </span>

          <h1>Gestión de lavandería</h1>

          <p>
            Registro, seguimiento y cálculo automático
            de servicios de lavandería.
          </p>
        </div>

        <button
          type="button"
          className="lavanderia-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nueva solicitud
        </button>
      </div>

      <section className="lavanderia-tarifa">
        <div>
          <span>Tarifa vigente de demostración</span>
          <strong>{moneda(PRECIO_POR_PRENDA)}</strong>
          <p>
            Por prenda. Un par de calcetines equivale
            a una prenda.
          </p>
        </div>

        <span className="lavanderia-tarifa-badge">
          Precio fijo
        </span>
      </section>

      <section className="lavanderia-stats">
        <article className="lavanderia-stat">
          <span>Total de solicitudes</span>
          <strong>{solicitudes.length}</strong>
        </article>

        <article className="lavanderia-stat">
          <span>Pendientes</span>
          <strong>{pendientes}</strong>
        </article>

        <article className="lavanderia-stat">
          <span>En proceso</span>
          <strong>{enProceso}</strong>
        </article>

        <article className="lavanderia-stat">
          <span>Listas / Entregadas</span>
          <strong>{listas + entregadas}</strong>
        </article>
      </section>

      <section className="lavanderia-panel">
        <div className="lavanderia-panel-header">
          <div>
            <h2>Solicitudes de lavandería</h2>
            <p>Control de prendas recibidas y entregadas</p>
          </div>

          <div className="lavanderia-filtros">
            <input
              type="search"
              placeholder="Buscar huésped o habitación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value)
              }
            >
              <option value="Todos">Todos los estados</option>

              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lavanderia-table-wrap">
          <table className="lavanderia-table">
            <thead>
              <tr>
                <th>Solicitud</th>
                <th>Huésped</th>
                <th>Detalle de prendas</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>
                    <strong>#{solicitud.id}</strong>
                    <small>{solicitud.fecha}</small>
                  </td>

                  <td>
                    <strong>{solicitud.huesped}</strong>
                    <small>{solicitud.habitacion}</small>
                  </td>

                  <td>
                    <div className="lavanderia-detalles">
                      {solicitud.prendas.map((prenda) => (
                        <span key={prenda.tipo}>
                          {prenda.cantidad} × {prenda.tipo}
                        </span>
                      ))}

                      {solicitud.observaciones && (
                        <small>
                          Nota: {solicitud.observaciones}
                        </small>
                      )}
                    </div>
                  </td>

                  <td>{solicitud.totalPrendas}</td>

                  <td>
                    <strong>
                      {moneda(solicitud.total)}
                    </strong>
                  </td>

                  <td>
                    <select
                      className="lavanderia-estado"
                      value={solicitud.estado}
                      onChange={(e) =>
                        cambiarEstado(
                          solicitud.id,
                          e.target.value as EstadoLavanderia
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
                </tr>
              ))}
            </tbody>
          </table>

          {solicitudesFiltradas.length === 0 && (
            <p className="lavanderia-vacio">
              No se encontraron solicitudes.
            </p>
          )}
        </div>
      </section>

      <p className="lavanderia-nota">
        Datos de demostración. Los cargos de lavandería
        se integrarán posteriormente con Cuentas y cobros
        mediante el backend de C# y PostgreSQL.
      </p>

      {mostrarFormulario && (
        <div className="lavanderia-overlay">
          <div
            className="lavanderia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lavanderia-modal-title"
          >
            <div className="lavanderia-modal-header">
              <h2 id="lavanderia-modal-title">
                Nueva solicitud de lavandería
              </h2>

              <button
                type="button"
                onClick={cerrarFormulario}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={registrarSolicitud}>
              <label htmlFor="lav-huesped">
                Nombre del huésped
              </label>

              <input
                id="lav-huesped"
                required
                value={nuevo.huesped}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    huesped: e.target.value,
                  })
                }
                placeholder="Nombre completo"
              />

              <label htmlFor="lav-habitacion">
                Habitación
              </label>

              <select
                id="lav-habitacion"
                required
                value={nuevo.habitacion}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    habitacion: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar habitación
                </option>

                {Array.from({ length: 14 }, (_, i) => (
                  <option
                    key={i}
                    value={`Habitación ${String(
                      i + 1
                    ).padStart(2, "0")}`}
                  >
                    Habitación{" "}
                    {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <div className="lavanderia-prendas-header">
                <h3>Prendas recibidas</h3>

                <button
                  type="button"
                  className="lavanderia-add"
                  onClick={agregarPrenda}
                >
                  + Agregar prenda
                </button>
              </div>

              {prendasNuevas.map((prenda, indice) => (
                <div
                  className="lavanderia-prenda-row"
                  key={indice}
                >
                  <select
                    aria-label={`Tipo de prenda ${indice + 1}`}
                    value={prenda.tipo}
                    onChange={(e) =>
                      actualizarPrenda(
                        indice,
                        "tipo",
                        e.target.value
                      )
                    }
                  >
                    {TIPOS_PRENDA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    aria-label={`Cantidad ${indice + 1}`}
                    value={prenda.cantidad}
                    onChange={(e) =>
                      actualizarPrenda(
                        indice,
                        "cantidad",
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="lavanderia-remove"
                    onClick={() => eliminarPrenda(indice)}
                    aria-label="Eliminar prenda"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <label htmlFor="lav-observaciones">
                Observaciones
              </label>

              <textarea
                id="lav-observaciones"
                rows={3}
                value={nuevo.observaciones}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    observaciones: e.target.value,
                  })
                }
                placeholder="Indicaciones especiales..."
              />

              <div className="lavanderia-resumen">
                <div>
                  <span>Precio por prenda</span>
                  <strong>
                    {moneda(PRECIO_POR_PRENDA)}
                  </strong>
                </div>

                <div>
                  <span>Cantidad de prendas</span>
                  <strong>{cantidadTotal}</strong>
                </div>

                <div className="lavanderia-resumen-total">
                  <span>Total del servicio</span>
                  <strong>{moneda(totalNuevo)}</strong>
                </div>
              </div>

              <div className="lavanderia-modal-actions">
                <button
                  type="button"
                  className="lavanderia-cancel"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="lavanderia-primary"
                >
                  Registrar solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Lavanderia;
