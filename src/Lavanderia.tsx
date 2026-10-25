import { useState, useEffect, useCallback } from "react";
import { laundryService } from "./services/laundry.service";
import { stayService } from "./services/stay.service";
import { useFeedback } from "./hooks/useFeedback";
import type { LaundryOrder, DetallePrenda, Stay } from "./services/types";
import "./Lavanderia.css";

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

const estados: EstadoLavanderia[] = [
  "Pendiente",
  "En proceso",
  "Listo",
  "Entregado",
  "Cancelado",
];

const crearDetalleVacio = (): DetallePrenda[] => [
  { tipo: "Camisa", cantidad: 1 },
];

function Lavanderia() {
  const { notify } = useFeedback();
  const [solicitudes, setSolicitudes] = useState<LaundryOrder[]>([]);
  const [estancias, setEstancias] = useState<Stay[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevo, setNuevo] = useState({
    stayId: "",
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

  const cargarSolicitudes = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await laundryService.getAll(query);
      setSolicitudes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar solicitudes de lavandería.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEstancias = useCallback(async () => {
    try {
      setEstancias(await stayService.getAll("Activa"));
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "No se pudieron cargar las estancias activas", "error");
    }
  }, [notify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarSolicitudes(busqueda);
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda, cargarSolicitudes]);

  useEffect(() => {
    const timer = window.setTimeout(() => void cargarEstancias(), 0);
    return () => window.clearTimeout(timer);
  }, [cargarEstancias]);

  const abrirFormulario = () => {
    void cargarEstancias();
    setMostrarFormulario(true);
  };

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
      filtroEstado === "Todos" || s.estado === filtroEstado;

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
      stayId: "",
      observaciones: "",
    });
    setPrendasNuevas(crearDetalleVacio());
  };

  const registrarSolicitud = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!nuevo.stayId) {
      notify("Selecciona una estancia activa.", "error");
      return;
    }

    if (
      prendasNuevas.length === 0 ||
      prendasNuevas.some(
        (p) => !Number.isInteger(p.cantidad) || p.cantidad < 1
      )
    ) {
      notify("Agrega prendas con cantidades válidas.", "error");
      return;
    }

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

    try {
      setSubmitting(true);
      await laundryService.create({
        stayId: Number(nuevo.stayId),
        prendas: agrupadas,
        observaciones: nuevo.observaciones.trim(),
      });

      cerrarFormulario();
      await cargarSolicitudes(busqueda);
      notify("Solicitud registrada y agregada a la estancia");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar la solicitud.";
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (
    id: number,
    estado: EstadoLavanderia
  ) => {
    try {
      await laundryService.updateStatus(id, estado);
      await cargarSolicitudes(busqueda);
      notify("Estado de lavandería actualizado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar el estado del servicio.";
      notify(msg, "error");
    }
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
            Registro, seguimiento y cálculo automático de servicios de lavandería.
          </p>
        </div>

        <button
          type="button"
          className="lavanderia-primary"
          onClick={abrirFormulario}
        >
          + Nueva solicitud
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
            onClick={() => cargarSolicitudes(busqueda)}
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

      <section className="lavanderia-tarifa">
        <div>
          <span>Tarifa del servicio</span>
          <strong>{moneda(PRECIO_POR_PRENDA)}</strong>
          <p>
            Por prenda procesada. Cálculo automático respaldado en el servidor central.
          </p>
        </div>

        <span className="lavanderia-tarifa-badge">
          Precio estándar
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
            <p>Control de prendas recibidas y entregadas en tiempo real</p>
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
                      {solicitud.prendas.map((prenda, idx) => (
                        <span key={`${prenda.tipo}-${idx}`}>
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

          {loading && (
            <p style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              Cargando solicitudes...
            </p>
          )}

          {!loading && solicitudesFiltradas.length === 0 && (
            <p className="lavanderia-vacio">
              No se encontraron solicitudes registradas.
            </p>
          )}
        </div>
      </section>

      <p className="lavanderia-nota">
        Servicio de lavandería sincronizado directamente con Nicabliss API. Registro y cálculo de tarifas procesado en el servidor.
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
                x
              </button>
            </div>

            <form onSubmit={registrarSolicitud}>
              <label htmlFor="lav-estancia">
                Estancia activa
              </label>

              <select
                id="lav-estancia"
                required
                value={nuevo.stayId}
                onChange={(e) =>
                  setNuevo({
                    ...nuevo,
                    stayId: e.target.value,
                  })
                }
              >
                <option value="">
                  Seleccionar huésped y habitación
                </option>
                {estancias.map((estancia) => (
                  <option key={estancia.id} value={estancia.id}>
                    {estancia.customerName} · {estancia.habitacion} · {estancia.reservationCode}
                  </option>
                ))}
              </select>
              {estancias.length === 0 && <small>No hay estancias activas. Registra un check-in antes de crear la solicitud.</small>}

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
                    x
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
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="lavanderia-primary"
                  disabled={submitting}
                >
                  {submitting ? "Registrando..." : "Registrar solicitud"}
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
