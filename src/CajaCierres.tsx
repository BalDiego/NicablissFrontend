import { useState, useEffect, useCallback } from "react";
import { cashService } from "./services/cash.service";
import { useFeedback } from "./hooks/useFeedback";
import { useAuth } from "./hooks/useAuth";
import type {
  CashByMethodRow,
  CashByUserRow,
  CashReconciliation,
  CashSession,
  TipoMovimiento,
  ConceptoMovimiento,
  MetodoPago,
} from "./services/types";
import "./CajaCierres.css";

const dinero = (valor: number) =>
  valor.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const conceptosIngreso: ConceptoMovimiento[] = [
  "Hospedaje",
  "Alimentos",
  "Lavandería",
  "Otro ingreso",
];

const conceptosSalida: ConceptoMovimiento[] = [
  "Gasto operativo",
  "Retiro de efectivo",
];

const issueLabels: Record<string, string> = {
  MISSING_MOVEMENT: "Movimiento faltante",
  MOVEMENT_WRONG_SESSION: "Turno incorrecto",
  AMOUNT_MISMATCH: "Monto diferente",
  DIRECTION_MISMATCH: "Dirección incorrecta",
  METHOD_MISMATCH: "Método diferente",
  USER_MISMATCH: "Usuario diferente",
};

function CajaCierres() {
  const { notify, confirm } = useFeedback();
  const { user } = useAuth();
  const [sesion, setSesion] = useState<CashSession | null>(null);
  const [historial, setHistorial] = useState<CashSession[]>([]);
  const [conciliacion, setConciliacion] = useState<CashReconciliation | null>(null);
  const [porMetodo, setPorMetodo] = useState<CashByMethodRow[]>([]);
  const [porUsuario, setPorUsuario] = useState<CashByUserRow[]>([]);
  const [filtroMetodo, setFiltroMetodo] = useState<MetodoPago | "">("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [mostrarApertura, setMostrarApertura] = useState(false);
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);

  const [fondoInicial, setFondoInicial] = useState("0");

  const [tipo, setTipo] = useState<TipoMovimiento>("Ingreso");
  const [concepto, setConcepto] = useState<ConceptoMovimiento>("Hospedaje");
  const [descripcion, setDescripcion] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("Efectivo");
  const [monto, setMonto] = useState("");

  const [efectivoContado, setEfectivoContado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [movementIdempotencyKey, setMovementIdempotencyKey] = useState("");

  const cargarDatosCaja = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [current, history] = await Promise.all([
        cashService.getCurrentSession(),
        cashService.getHistory(),
      ]);
      setSesion(current);
      setHistorial(history);
      if (current) {
        const [reconciliationData, methodData, userData] = await Promise.all([
          cashService.getReconciliation(
            current.id,
            filtroMetodo || undefined,
            filtroUsuario || undefined
          ),
          cashService.getByMethod(current.id, filtroUsuario || undefined),
          cashService.getByUser(current.id, filtroMetodo || undefined),
        ]);
        setConciliacion(reconciliationData);
        setPorMetodo(methodData.rows);
        setPorUsuario(userData.rows);
      } else {
        setConciliacion(null);
        setPorMetodo([]);
        setPorUsuario([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al consultar el módulo de caja.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filtroMetodo, filtroUsuario]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatosCaja();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargarDatosCaja]);

  const movimientos = sesion?.movimientos ?? [];

  const ingresos = sesion
    ? sesion.ingresosEfectivo + sesion.ingresosDigitales
    : 0;

  const ingresosEfectivo = sesion?.ingresosEfectivo ?? 0;
  const ingresosDigitales = sesion?.ingresosDigitales ?? 0;
  const salidasEfectivo = sesion?.salidasEfectivo ?? 0;
  const efectivoEsperado = sesion?.efectivoEsperado ?? 0;
  const esResponsable = Boolean(sesion && user && sesion.openedBy === user.id);
  const cierreAdministrativo = Boolean(sesion && user?.role === "ADMIN" && sesion.openedBy !== user.id);
  const puedeCerrar = esResponsable || cierreAdministrativo;

  const contado = Number(efectivoContado);
  const diferencia = contado - efectivoEsperado;

  const abrirCaja = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fondo = Number(fondoInicial);

    if (!Number.isFinite(fondo) || fondo < 0) {
      notify("El fondo inicial debe ser válido.", "error");
      return;
    }

    try {
      setSubmitting(true);
      await cashService.openSession(fondo);

      setMostrarApertura(false);
      setFondoInicial("0");
      await cargarDatosCaja();
      notify("Caja abierta correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al abrir la caja.";
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const registrarMovimiento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sesion) return;

    const valor = Number(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      notify("Ingresa un monto mayor que cero.", "error");
      return;
    }

    if (tipo === "Salida" && metodo === "Efectivo" && valor > efectivoEsperado) {
      notify("La salida supera el efectivo disponible en caja.", "error");
      return;
    }

    try {
      setSubmitting(true);
      await cashService.addMovement({
        tipo,
        concepto,
        descripcion: descripcion.trim(),
        metodo,
        monto: valor,
      }, movementIdempotencyKey || undefined);

      setMostrarMovimiento(false);
      setMovementIdempotencyKey("");
      setTipo("Ingreso");
      setConcepto("Hospedaje");
      setDescripcion("");
      setMetodo("Efectivo");
      setMonto("");
      await cargarDatosCaja();
      notify("Movimiento manual registrado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el movimiento.";
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const cerrarCaja = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sesion) return;

    if (
      efectivoContado.trim() === "" ||
      !Number.isFinite(contado) ||
      contado < 0
    ) {
      notify("Ingresa el efectivo contado.", "error");
      return;
    }

    if (!conciliacion?.balanced) {
      notify("No se puede cerrar: existen descuadres en la conciliación automática.", "error");
      return;
    }

    if (cierreAdministrativo && !observaciones.trim()) {
      notify("El cierre administrativo requiere indicar el motivo.", "error");
      return;
    }

    const confirmed = await confirm(
      `${cierreAdministrativo ? "¿Confirmas el cierre administrativo de caja?" : "¿Confirmas el cierre de caja?"} Efectivo esperado: ${dinero(efectivoEsperado)}; contado: ${dinero(contado)}; diferencia: ${dinero(diferencia)}.`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await cashService.closeSession(contado, observaciones.trim());

      setMostrarCierre(false);
      setEfectivoContado("");
      setObservaciones("");
      await cargarDatosCaja();
      notify("Caja cerrada correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cerrar la caja.";
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const abrirFormularioMovimiento = () => {
    setTipo("Ingreso");
    setConcepto("Hospedaje");
    setMetodo("Efectivo");
    setDescripcion("");
    setMonto("");
    setMovementIdempotencyKey(crypto.randomUUID());
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
            Control de movimientos, arqueos y cierres por turno en tiempo real.
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
            {esResponsable && (
              <button
                type="button"
                className="caja-secondary"
                onClick={abrirFormularioMovimiento}
              >
                + Registrar movimiento
              </button>
            )}

            {puedeCerrar && (
              <button
                type="button"
                className="caja-primary"
                onClick={() => setMostrarCierre(true)}
              >
                {cierreAdministrativo ? "Cierre administrativo" : "Realizar cierre"}
              </button>
            )}
          </div>
        )}
      </header>

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
          <span>Error de conexión: {error}</span>
          <button
            type="button"
            onClick={cargarDatosCaja}
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

      <section
        className={`caja-session ${sesion ? "caja-session-open" : ""}`}
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
          className={`caja-status ${sesion ? "caja-status-open" : ""}`}
        >
          {sesion ? "En operación" : "Sin sesión"}
        </span>
      </section>

      {sesion && !esResponsable && (
        <div className={`caja-alert ${cierreAdministrativo ? "caja-alert-success" : "caja-alert-danger"}`} role="status">
          <strong>Caja abierta por {sesion.openedByName || sesion.responsable}</strong>
          <span>
            {cierreAdministrativo
              ? "Como administrador puedes cerrar esta sesión indicando el motivo; no puedes registrar movimientos en nombre del responsable."
              : "Solo el responsable de este turno puede registrar cobros y movimientos. Pide que cierre la sesión antes de iniciar otro turno."}
          </span>
        </div>
      )}

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

      {sesion && conciliacion && (
        <section className="caja-panel caja-reconciliation">
          <div className="caja-panel-heading">
            <div>
              <h2>Conciliación financiera</h2>
              <p>Comparación en centavos entre pagos, reversiones y movimientos automáticos del turno.</p>
            </div>
            <span className={`caja-reconciliation-status ${conciliacion.balanced ? "is-balanced" : "is-unbalanced"}`}>
              {conciliacion.balanced ? "Conciliada" : "Con descuadres"}
            </span>
          </div>

          <div className="caja-report-filters">
            <label>
              Método
              <select
                value={filtroMetodo}
                onChange={(event) => {
                  setFiltroMetodo(event.target.value as MetodoPago | "");
                  setFiltroUsuario("");
                }}
              >
                <option value="">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </label>
            <label>
              Usuario
              <select value={filtroUsuario} onChange={(event) => setFiltroUsuario(event.target.value)}>
                <option value="">Todos los usuarios</option>
                {porUsuario.map((row) => (
                  <option key={row.userId} value={row.userId}>{row.userName}</option>
                ))}
              </select>
            </label>
            {(filtroMetodo || filtroUsuario) && (
              <button
                type="button"
                className="caja-secondary"
                onClick={() => { setFiltroMetodo(""); setFiltroUsuario(""); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {!conciliacion.balanced && (
            <div className="caja-alert caja-alert-danger" role="alert">
              <strong>El cierre está bloqueado.</strong>
              <span>
                Diferencia: {dinero(conciliacion.totals.difference)} · {conciliacion.mismatchCount} pagos con incidencia · {conciliacion.orphanMovementCount} movimientos huérfanos.
              </span>
            </div>
          )}
          {conciliacion.balanced && (
            <div className="caja-alert caja-alert-success">
              <strong>Pagos y movimientos automáticos coinciden.</strong>
              <span>La sesión también conserva consistencia en sus acumulados de efectivo y dinero digital.</span>
            </div>
          )}

          <div className="caja-reconciliation-totals">
            <article><span>Cobros</span><strong>{dinero(conciliacion.totals.payments)}</strong><small>{conciliacion.totals.paymentCount} registros, antes de reversiones</small></article>
            <article><span>Reversiones</span><strong>-{dinero(conciliacion.totals.reversals)}</strong><small>Movimientos contables inversos</small></article>
            <article><span>Neto cobrado</span><strong>{dinero(conciliacion.totals.netPayments)}</strong><small>Según pagos</small></article>
            <article><span>Neto en caja</span><strong>{dinero(conciliacion.totals.netMovements)}</strong><small>Según movimientos automáticos</small></article>
          </div>

          <h3 className="caja-subtitle">Separación por método</h3>
          <div className="caja-method-grid">
            {porMetodo.map((row) => (
              <article key={row.method} className={row.balanced ? "is-balanced" : "is-unbalanced"}>
                <span>{row.method}</span>
                <strong>{dinero(row.netPayments)}</strong>
                <small>Caja: {dinero(row.netMovements)} · Dif.: {dinero(row.difference)}</small>
              </article>
            ))}
          </div>

          <div className="caja-panel-heading caja-payments-heading">
            <div><h3>Pagos automáticos</h3><p>Cada cobro debe tener exactamente un movimiento equivalente.</p></div>
            <span className="caja-counter">{conciliacion.items.length} pagos</span>
          </div>
          <div className="caja-table-wrap">
            <table className="caja-table">
              <thead><tr><th>Pago</th><th>Usuario</th><th>Método</th><th>Pago neto</th><th>Movimiento</th><th>Diferencia</th><th>Validación</th></tr></thead>
              <tbody>
                {conciliacion.items.map((item) => (
                  <tr key={item.paymentId}>
                    <td><strong>{item.paymentNumber}</strong><small>{item.kind === "REVERSAL" ? "Reversión" : "Cobro"}</small></td>
                    <td>{item.userName}</td>
                    <td>{item.method}</td>
                    <td>{dinero(item.expectedAmount)}</td>
                    <td>{item.movementId ? dinero(item.movementAmount) : "Sin movimiento"}</td>
                    <td className={Math.abs(item.difference) < 0.005 ? "caja-balanced-text" : "caja-unbalanced-text"}>{dinero(item.difference)}</td>
                    <td>
                      {item.issues.length === 0
                        ? <span className="caja-match">Correcto</span>
                        : <span className="caja-mismatch">{item.issues.map((issue) => issueLabels[issue] || issue).join(", ")}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {conciliacion.items.length === 0 && <div className="caja-empty"><strong>No hay pagos automáticos</strong><p>Los movimientos manuales no se consideran cobros.</p></div>}
          </div>

          <div className="caja-manual-summary">
            <span>Movimientos manuales informativos</span>
            <strong>Ingresos {dinero(conciliacion.totals.manualIncome)} · Salidas {dinero(conciliacion.totals.manualOutput)}</strong>
          </div>
        </section>
      )}

      <section className="caja-panel">
        <div className="caja-panel-heading">
          <div>
            <h2>Movimientos del turno</h2>
            <p>
              Registro de ingresos y salidas de la sesión actual en el backend.
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
                <th>Origen</th>
                <th>Registrado por</th>
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

                  <td>{movimiento.source === "PAYMENT" ? "Pago automático" : movimiento.source === "REVERSAL" ? "Reversión automática" : "Manual"}</td>

                  <td>{movimiento.createdByName || "Sistema"}</td>

                  <td>{movimiento.metodo}</td>

                  <td>
                    <strong>
                      {movimiento.tipo === "Salida" ? "-" : "+"}
                      {dinero(movimiento.monto)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              Cargando movimientos...
            </p>
          )}

          {!loading && movimientos.length === 0 && (
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
              Resumen de turnos finalizados guardados en el servidor.
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
                <th>Cerrado por</th>
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
                  <td>{cierre.cierre || "—"}</td>
                  <td>{cierre.closedByName || "Histórico sin atribución"}</td>

                  <td>
                    {dinero(
                      cierre.ingresosEfectivo + cierre.ingresosDigitales
                    )}
                  </td>

                  <td>
                    {dinero(cierre.efectivoEsperado)}
                  </td>

                  <td>
                    <span
                      className={`caja-difference ${
                        Math.abs(cierre.diferencia ?? 0) < 0.005
                          ? "caja-balanced"
                          : "caja-unbalanced"
                      }`}
                    >
                      {(cierre.diferencia ?? 0) > 0 ? "+" : ""}
                      {dinero(cierre.diferencia ?? 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && historial.length === 0 && (
            <div className="caja-empty">
              <strong>
                Aún no existen cierres
              </strong>
              <p>
                Los cierres aparecerán aquí después de finalizar un turno.
              </p>
            </div>
          )}
        </div>
      </section>

      <p className="caja-note">
        Control de caja centralizado con Nicabliss API. Turnos, ingresos, salidas y arqueos de efectivo con registro auditable.
      </p>

      {mostrarApertura && (
        <div className="caja-overlay">
          <div className="caja-modal" role="dialog" aria-modal="true" aria-labelledby="caja-apertura-title">
            <div className="caja-modal-heading">
              <h2 id="caja-apertura-title">Apertura de caja</h2>

              <button
                type="button"
                onClick={() => setMostrarApertura(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={abrirCaja}>
              <div className="caja-summary">
                <div>
                  <span>Responsable autenticado</span>
                  <strong>{user?.fullName || user?.username || "Usuario actual"}</strong>
                </div>
              </div>

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
                  onClick={() => setMostrarApertura(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                  disabled={submitting}
                >
                  {submitting ? "Abriendo..." : "Abrir caja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarMovimiento && sesion && esResponsable && (
        <div className="caja-overlay">
          <div className="caja-modal">
            <div className="caja-modal-heading">
              <h2>Registrar movimiento</h2>

              <button
                type="button"
                onClick={() => setMostrarMovimiento(false)}
              >
                x
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
                  const nuevoTipo = e.target.value as TipoMovimiento;
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
                <option value="Ingreso">Ingreso</option>
                <option value="Salida">Salida</option>
              </select>

              <label htmlFor="caja-concepto">
                Concepto
              </label>

              <select
                id="caja-concepto"
                value={concepto}
                onChange={(e) =>
                  setConcepto(e.target.value as ConceptoMovimiento)
                }
              >
                {(tipo === "Ingreso" ? conceptosIngreso : conceptosSalida).map(
                  (opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  )
                )}
              </select>

              <label htmlFor="caja-descripcion">
                Descripción
              </label>

              <textarea
                id="caja-descripcion"
                rows={3}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle del movimiento..."
              />

              <label htmlFor="caja-metodo">
                Método de pago
              </label>

              <select
                id="caja-metodo"
                value={metodo}
                disabled={tipo === "Salida"}
                onChange={(e) => setMetodo(e.target.value as MetodoPago)}
              >
                <option value="Efectivo">Efectivo</option>
                {tipo === "Ingreso" && (
                  <>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
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
                onChange={(e) => setMonto(e.target.value)}
              />

              <div className="caja-modal-actions">
                <button
                  type="button"
                  className="caja-secondary"
                  onClick={() => setMostrarMovimiento(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar movimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarCierre && sesion && puedeCerrar && (
        <div className="caja-overlay">
          <div className="caja-modal">
            <div className="caja-modal-heading">
              <h2>{cierreAdministrativo ? "Cierre administrativo de caja" : "Arqueo y cierre de caja"}</h2>

              <button
                type="button"
                onClick={() => setMostrarCierre(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={cerrarCaja}>
              <div className="caja-summary">
                <div>
                  <span>Fondo inicial</span>
                  <strong>{dinero(sesion.fondoInicial)}</strong>
                </div>

                <div>
                  <span>Ingresos en efectivo</span>
                  <strong>{dinero(ingresosEfectivo)}</strong>
                </div>

                <div>
                  <span>Ingresos digitales</span>
                  <strong>{dinero(ingresosDigitales)}</strong>
                </div>

                <div>
                  <span>Salidas de efectivo</span>
                  <strong>-{dinero(salidasEfectivo)}</strong>
                </div>

                <div className="caja-summary-total">
                  <span>Efectivo esperado</span>
                  <strong>{dinero(efectivoEsperado)}</strong>
                </div>
              </div>

              <div className={`caja-alert ${conciliacion?.balanced ? "caja-alert-success" : "caja-alert-danger"}`}>
                <strong>{conciliacion?.balanced ? "Conciliación correcta" : "Conciliación pendiente"}</strong>
                <span>
                  {conciliacion?.balanced
                    ? "Los pagos y movimientos automáticos coinciden; el cierre puede continuar."
                    : "Revisa los descuadres antes de cerrar. El servidor rechazará un cierre no conciliado."}
                </span>
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
                onChange={(e) => setEfectivoContado(e.target.value)}
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
                required={cierreAdministrativo}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder={cierreAdministrativo ? "Motivo obligatorio del cierre administrativo..." : "Observaciones del turno..."}
              />

              <div className="caja-modal-actions">
                <button
                  type="button"
                  className="caja-secondary"
                  onClick={() => setMostrarCierre(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="caja-primary"
                  disabled={submitting || !conciliacion?.balanced || (cierreAdministrativo && !observaciones.trim())}
                >
                  {submitting ? "Cerrando..." : cierreAdministrativo ? "Confirmar cierre administrativo" : "Confirmar cierre"}
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
