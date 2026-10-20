
import { useState } from "react";
import "./CajaCierres.css";

type MetodoPago = "Efectivo" | "Transferencia" | "Tarjeta";
type TipoMovimiento = "Ingreso" | "Salida";
type Concepto =
  | "Hospedaje"
  | "Alimentos"
  | "Lavandería"
  | "Otro ingreso"
  | "Gasto operativo"
  | "Retiro de efectivo";

type Movimiento = {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  concepto: Concepto;
  descripcion: string;
  metodo: MetodoPago;
  monto: number;
};

type CierreCaja = {
  id: number;
  responsable: string;
  apertura: string;
  cierre: string;
  fondoInicial: number;
  ingresosEfectivo: number;
  ingresosDigitales: number;
  salidasEfectivo: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number;
  observaciones: string;
  movimientos: Movimiento[];
};

type SesionCaja = {
  responsable: string;
  apertura: string;
  fondoInicial: number;
  movimientos: Movimiento[];
};

const dinero = (valor: number) =>
  valor.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const fechaActual = () =>
  new Date().toLocaleString("es-NI", {
    dateStyle: "short",
    timeStyle: "short",
  });

const conceptosIngreso: Concepto[] = [
  "Hospedaje",
  "Alimentos",
  "Lavandería",
  "Otro ingreso",
];

const conceptosSalida: Concepto[] = [
  "Gasto operativo",
  "Retiro de efectivo",
];

function CajaCierres() {
  const [sesion, setSesion] = useState<SesionCaja | null>(
    null
  );

  const [historial, setHistorial] = useState<CierreCaja[]>(
    []
  );

  const [mostrarApertura, setMostrarApertura] =
    useState(false);

  const [mostrarMovimiento, setMostrarMovimiento] =
    useState(false);

  const [mostrarCierre, setMostrarCierre] =
    useState(false);

  const [responsable, setResponsable] = useState("");
  const [fondoInicial, setFondoInicial] = useState("0");

  const [tipo, setTipo] =
    useState<TipoMovimiento>("Ingreso");

  const [concepto, setConcepto] =
    useState<Concepto>("Hospedaje");

  const [descripcion, setDescripcion] = useState("");
  const [metodo, setMetodo] =
    useState<MetodoPago>("Efectivo");

  const [monto, setMonto] = useState("");

  const [efectivoContado, setEfectivoContado] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const movimientos = sesion?.movimientos ?? [];

  const ingresos = movimientos
    .filter((m) => m.tipo === "Ingreso")
    .reduce((total, m) => total + m.monto, 0);

  const ingresosEfectivo = movimientos
    .filter(
      (m) =>
        m.tipo === "Ingreso" &&
        m.metodo === "Efectivo"
    )
    .reduce((total, m) => total + m.monto, 0);

  const ingresosDigitales = movimientos
    .filter(
      (m) =>
        m.tipo === "Ingreso" &&
        m.metodo !== "Efectivo"
    )
    .reduce((total, m) => total + m.monto, 0);

  const salidasEfectivo = movimientos
    .filter(
      (m) =>
        m.tipo === "Salida" &&
        m.metodo === "Efectivo"
    )
    .reduce((total, m) => total + m.monto, 0);

  const efectivoEsperado =
    (sesion?.fondoInicial ?? 0) +
    ingresosEfectivo -
    salidasEfectivo;

  const contado = Number(efectivoContado);
  const diferencia = contado - efectivoEsperado;

  const abrirCaja = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const fondo = Number(fondoInicial);

    if (!responsable.trim()) {
      alert("Ingresa el nombre del responsable.");
      return;
    }

    if (!Number.isFinite(fondo) || fondo < 0) {
      alert("El fondo inicial debe ser válido.");
      return;
    }

    setSesion({
      responsable: responsable.trim(),
      apertura: fechaActual(),
      fondoInicial: fondo,
      movimientos: [],
    });

    setMostrarApertura(false);
    setResponsable("");
    setFondoInicial("0");
  };

  const registrarMovimiento = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!sesion) return;

    const valor = Number(monto);

    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Ingresa un monto mayor que cero.");
      return;
    }

    if (
      tipo === "Salida" &&
      metodo === "Efectivo" &&
      valor > efectivoEsperado
    ) {
      alert(
        "La salida supera el efectivo disponible en caja."
      );
      return;
    }

    const movimiento: Movimiento = {
      id: Date.now(),
      fecha: fechaActual(),
      tipo,
      concepto,
      descripcion: descripcion.trim(),
      metodo,
      monto: valor,
    };

    setSesion({
      ...sesion,
      movimientos: [
        movimiento,
        ...sesion.movimientos,
      ],
    });

    setMostrarMovimiento(false);
    setTipo("Ingreso");
    setConcepto("Hospedaje");
    setDescripcion("");
    setMetodo("Efectivo");
    setMonto("");
  };

  const cerrarCaja = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!sesion) return;

    if (
      efectivoContado.trim() === "" ||
      !Number.isFinite(contado) ||
      contado < 0
    ) {
      alert("Ingresa el efectivo contado.");
      return;
    }

    const cierre: CierreCaja = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now(),
      responsable: sesion.responsable,
      apertura: sesion.apertura,
      cierre: fechaActual(),
      fondoInicial: sesion.fondoInicial,
      ingresosEfectivo,
      ingresosDigitales,
      salidasEfectivo,
      efectivoEsperado,
      efectivoContado: contado,
      diferencia,
      observaciones: observaciones.trim(),
      movimientos: [...sesion.movimientos],
    };

    setHistorial([cierre, ...historial]);

    setSesion(null);
    setMostrarCierre(false);
    setEfectivoContado("");
    setObservaciones("");
  };

  const abrirFormularioMovimiento = () => {
    setTipo("Ingreso");
    setConcepto("Hospedaje");
    setMetodo("Efectivo");
    setDescripcion("");
    setMonto("");
    setMostrarMovimiento(true);
  };

  return (
    <main className="caja-page">
      <header className="caja-heading">
        <div>
          <span className="caja-eyebrow">
            NICABLISS / ADMINISTRACIÓN
          </span>

          <h1>Caja y cierres</h1>

          <p>
            Control de movimientos, arqueos y cierres
            por turno de recepción.
          </p>
        </div>

        {!sesion ? (
          <button
            type="button"
            className="caja-primary"
            onClick={() => setMostrarApertura(true)}
          >
            + Abrir caja
          </button>
        ) : (
          <div className="caja-heading-actions">
            <button
              type="button"
              className="caja-secondary"
              onClick={abrirFormularioMovimiento}
            >
              + Registrar movimiento
            </button>

            <button
              type="button"
              className="caja-primary"
              onClick={() => setMostrarCierre(true)}
            >
              Realizar cierre
            </button>
          </div>
        )}
      </header>

      <section
        className={`caja-session ${
          sesion ? "caja-session-open" : ""
        }`}
      >
        <div>
          <span className="caja-session-label">
            Estado de caja
          </span>

          <h2>
            {sesion ? "Caja abierta" : "Caja cerrada"}
          </h2>

          <p>
            {sesion
              ? `Responsable: ${sesion.responsable}`
              : "No hay un turno de caja activo."}
          </p>

          {sesion && (
            <small>
              Apertura: {sesion.apertura}
            </small>
          )}
        </div>

        <span
          className={`caja-status ${
            sesion ? "caja-status-open" : ""
          }`}
        >
          {sesion ? "En operación" : "Sin sesión"}
        </span>
      </section>

      <section className="caja-stats">
        <article className="caja-stat">
          <span>Fondo inicial</span>
          <strong>
            {dinero(sesion?.fondoInicial ?? 0)}
          </strong>
          <small>Saldo de apertura</small>
        </article>

        <article className="caja-stat">
          <span>Ingresos del turno</span>
          <strong>{dinero(ingresos)}</strong>
          <small>Efectivo y pagos digitales</small>
        </article>

        <article className="caja-stat">
          <span>Salidas de efectivo</span>
          <strong>{dinero(salidasEfectivo)}</strong>
          <small>Gastos y retiros registrados</small>
        </article>

        <article className="caja-stat caja-stat-highlight">
          <span>Efectivo esperado</span>
          <strong>{dinero(efectivoEsperado)}</strong>
          <small>Saldo calculado en caja</small>
        </article>
      </section>

      <section className="caja-panel">
        <div className="caja-panel-heading">
          <div>
            <h2>Movimientos del turno</h2>
            <p>
              Registro de ingresos y salidas de la
              sesión actual.
            </p>
          </div>

          <span className="caja-counter">
            {movimientos.length} movimientos
          </span>
        </div>

        <div className="caja-table-wrap">
          <table className="caja-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Descripción</th>
                <th>Método</th>
                <th>Monto</th>
              </tr>
            </thead>

            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{movimiento.fecha}</td>

                  <td>
                    <span
                      className={`caja-type ${
                        movimiento.tipo === "Ingreso"
                          ? "caja-income"
                          : "caja-expense"
                      }`}
                    >
                      {movimiento.tipo}
                    </span>
                  </td>

                  <td>{movimiento.concepto}</td>

                  <td>
                    {movimiento.descripcion || "—"}
                  </td>

                  <td>{movimiento.metodo}</td>

                  <td>
                    <strong>
                      {movimiento.tipo === "Salida"
                        ? "-"
                        : "+"}
                      {dinero(movimiento.monto)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {movimientos.length === 0 && (
            <div className="caja-empty">
              <strong>
                No hay movimientos registrados
              </strong>
              <p>
                {sesion
                  ? "Registra un ingreso o una salida para comenzar."
                  : "Abre una caja para registrar operaciones."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="caja-panel">
        <div className="caja-panel-heading">
          <div>
            <h2>Historial de cierres</h2>
            <p>
              Resumen de turnos finalizados.
            </p>
          </div>

          <span className="caja-counter">
            {historial.length} cierres
          </span>
        </div>

        <div className="caja-table-wrap">
          <table className="caja-table">
            <thead>
              <tr>
                <th>Responsable</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Ingresos</th>
                <th>Efectivo esperado</th>
                <th>Diferencia</th>
              </tr>
            </thead>

            <tbody>
              {historial.map((cierre) => (
                <tr key={cierre.id}>
                  <td>
                    <strong>
                      {cierre.responsable}
                    </strong>
                  </td>

                  <td>{cierre.apertura}</td>
                  <td>{cierre.cierre}</td>

                  <td>
                    {dinero(
                      cierre.ingresosEfectivo +
                        cierre.ingresosDigitales
                    )}
                  </td>

                  <td>
                    {dinero(cierre.efectivoEsperado)}
                  </td>

                  <td>
                    <span
                      className={`caja-difference ${
                        Math.abs(cierre.diferencia) < 0.005
                          ? "caja-balanced"
                          : "caja-unbalanced"
                      }`}
                    >
                      {cierre.diferencia > 0 ? "+" : ""}
                      {dinero(cierre.diferencia)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {historial.length === 0 && (
            <div className="caja-empty">
              <strong>
                Aún no existen cierres
              </strong>
              <p>
                Los cierres aparecerán aquí después
                de finalizar un turno.
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="caja-note">
        Módulo de demostración: los registros se
        mantienen únicamente mientras la aplicación
        permanezca abierta. Posteriormente se
        integrarán con C# y PostgreSQL.
      </p>

      {mostrarApertura && (
        <div className="caja-overlay">
          <div className="caja-modal">
            <div className="caja-modal-heading">
              <h2>Apertura de caja</h2>

              <button
                type="button"
                onClick={() => setMostrarApertura(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={abrirCaja}>
              <label htmlFor="caja-responsable">
                Responsable del turno
              </label>

              <input
                id="caja-responsable"
                required
                value={responsable}
                onChange={(e) =>
                  setResponsable(e.target.value)
                }
                placeholder="Nombre del recepcionista"
              />

              <label htmlFor="caja-fondo">
                Fondo inicial ($)
              </label>

              <input
                id="caja-fondo"
                type="number"
                min="0"
                step="0.01"
                required
                value={fondoInicial}
                onChange={(e) =>
                  setFondoInicial(e.target.value)
                }
              />

              <div className="caja-modal-actions">
                <button
                  type="button"
                  className="caja-secondary"
                  onClick={() =>
                    setMostrarApertura(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                >
                  Abrir caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarMovimiento && sesion && (
        <div className="caja-overlay">
          <div className="caja-modal">
            <div className="caja-modal-heading">
              <h2>Registrar movimiento</h2>

              <button
                type="button"
                onClick={() =>
                  setMostrarMovimiento(false)
                }
              >
                ✕
              </button>
            </div>

            <form onSubmit={registrarMovimiento}>
              <label htmlFor="caja-tipo">
                Tipo de movimiento
              </label>

              <select
                id="caja-tipo"
                value={tipo}
                onChange={(e) => {
                  const nuevoTipo =
                    e.target.value as TipoMovimiento;

                  setTipo(nuevoTipo);

                  setConcepto(
                    nuevoTipo === "Ingreso"
                      ? "Hospedaje"
                      : "Gasto operativo"
                  );

                  if (nuevoTipo === "Salida") {
                    setMetodo("Efectivo");
                  }
                }}
              >
                <option value="Ingreso">
                  Ingreso
                </option>

                <option value="Salida">
                  Salida
                </option>
              </select>

              <label htmlFor="caja-concepto">
                Concepto
              </label>

              <select
                id="caja-concepto"
                value={concepto}
                onChange={(e) =>
                  setConcepto(
                    e.target.value as Concepto
                  )
                }
              >
                {(tipo === "Ingreso"
                  ? conceptosIngreso
                  : conceptosSalida
                ).map((opcion) => (
                  <option
                    key={opcion}
                    value={opcion}
                  >
                    {opcion}
                  </option>
                ))}
              </select>

              <label htmlFor="caja-descripcion">
                Descripción
              </label>

              <textarea
                id="caja-descripcion"
                rows={3}
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(e.target.value)
                }
                placeholder="Detalle del movimiento..."
              />

              <label htmlFor="caja-metodo">
                Método de pago
              </label>

              <select
                id="caja-metodo"
                value={metodo}
                disabled={tipo === "Salida"}
                onChange={(e) =>
                  setMetodo(
                    e.target.value as MetodoPago
                  )
                }
              >
                <option value="Efectivo">
                  Efectivo
                </option>

                {tipo === "Ingreso" && (
                  <>
                    <option value="Transferencia">
                      Transferencia
                    </option>

                    <option value="Tarjeta">
                      Tarjeta
                    </option>
                  </>
                )}
              </select>

              <label htmlFor="caja-monto">
                Monto ($)
              </label>

              <input
                id="caja-monto"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={monto}
                onChange={(e) =>
                  setMonto(e.target.value)
                }
              />

              <div className="caja-modal-actions">
                <button
                  type="button"
                  className="caja-secondary"
                  onClick={() =>
                    setMostrarMovimiento(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                >
                  Guardar movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarCierre && sesion && (
        <div className="caja-overlay">
          <div className="caja-modal">
            <div className="caja-modal-heading">
              <h2>Arqueo y cierre de caja</h2>

              <button
                type="button"
                onClick={() =>
                  setMostrarCierre(false)
                }
              >
                ✕
              </button>
            </div>

            <form onSubmit={cerrarCaja}>
              <div className="caja-summary">
                <div>
                  <span>Fondo inicial</span>
                  <strong>
                    {dinero(sesion.fondoInicial)}
                  </strong>
                </div>

                <div>
                  <span>Ingresos en efectivo</span>
                  <strong>
                    {dinero(ingresosEfectivo)}
                  </strong>
                </div>

                <div>
                  <span>Ingresos digitales</span>
                  <strong>
                    {dinero(ingresosDigitales)}
                  </strong>
                </div>

                <div>
                  <span>Salidas de efectivo</span>
                  <strong>
                    -{dinero(salidasEfectivo)}
                  </strong>
                </div>

                <div className="caja-summary-total">
                  <span>Efectivo esperado</span>
                  <strong>
                    {dinero(efectivoEsperado)}
                  </strong>
                </div>
              </div>

              <label htmlFor="caja-contado">
                Efectivo contado ($)
              </label>

              <input
                id="caja-contado"
                type="number"
                min="0"
                step="0.01"
                required
                value={efectivoContado}
                onChange={(e) =>
                  setEfectivoContado(e.target.value)
                }
                placeholder="Monto contado físicamente"
              />

              {efectivoContado.trim() !== "" && (
                <div className="caja-result">
                  <span>Diferencia de caja</span>

                  <strong>
                    {diferencia > 0 ? "+" : ""}
                    {dinero(diferencia)}
                  </strong>

                  <small>
                    {Math.abs(diferencia) < 0.005
                      ? "Caja cuadrada"
                      : diferencia > 0
                      ? "Sobrante de efectivo"
                      : "Faltante de efectivo"}
                  </small>
                </div>
              )}

              <label htmlFor="caja-observaciones">
                Observaciones del cierre
              </label>

              <textarea
                id="caja-observaciones"
                rows={3}
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(e.target.value)
                }
                placeholder="Observaciones del turno..."
              />

              <div className="caja-modal-actions">
                <button
                  type="button"
                  className="caja-secondary"
                  onClick={() =>
                    setMostrarCierre(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                >
                  Confirmar cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default CajaCierres;
