import { useEffect, useRef, useState } from "react";
import { cashService } from "../../services/cash.service";
import type { CashReconciliation, CashSession, ReconciliationIssue } from "../../services/types";
import "./cash-closure-detail.css";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const issueLabels: Record<ReconciliationIssue, string> = {
  MISSING_MOVEMENT: "Falta el movimiento en Caja",
  MOVEMENT_WRONG_SESSION: "El movimiento pertenece a otro turno",
  AMOUNT_MISMATCH: "El importe no coincide",
  DIRECTION_MISMATCH: "El tipo de movimiento no coincide",
  METHOD_MISMATCH: "El método de pago no coincide",
  USER_MISMATCH: "El usuario no coincide",
};

function movementSourceLabel(source: CashSession["movimientos"][number]["source"]): string {
  switch (source) {
    case "PAYMENT": return "Pago automático";
    case "REVERSAL": return "Reversión automática";
    case "MIGRATION": return "Registro migrado";
    case "MANUAL": return "Manual";
    default: return "Sin clasificar";
  }
}

function differenceLabel(value: number | undefined, counted: number | undefined): string {
  if (counted === undefined || value === undefined) return "Arqueo no disponible";
  if (Math.abs(value) < 0.005) return "Caja cuadrada";
  return value > 0 ? "Sobrante de efectivo" : "Faltante de efectivo";
}

function DetailMetric({ label, value, note, tone }: {
  label: string;
  value: string;
  note?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <article className={`caja-detail-metric${tone ? ` is-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export default function CashClosureDetail({ session, onClose }: {
  session: CashSession;
  onClose: () => void;
}) {
  const [reconciliation, setReconciliation] = useState<CashReconciliation | null>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(true);
  const [reconciliationError, setReconciliationError] = useState("");
  const requestId = useRef(0);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    void cashService.getReconciliation(session.id).then((result) => {
      if (currentRequest !== requestId.current) return;
      setReconciliation(result);
      setReconciliationLoading(false);
    }).catch((caught: unknown) => {
      if (currentRequest !== requestId.current) return;
      setReconciliationError(caught instanceof Error ? caught.message : "No se pudo consultar la conciliación de este cierre.");
      setReconciliationLoading(false);
    });
    return () => { requestId.current += 1; };
  }, [session.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const difference = session.diferencia;
  const differenceTone = difference === undefined || Math.abs(difference) < 0.005
    ? "positive"
    : difference > 0 ? "positive" : "negative";
  const reconciliationStatus = reconciliationLoading
    ? "Consultando conciliación…"
    : reconciliationError
      ? "Conciliación no disponible"
        : reconciliation?.balanced
          ? "Conciliación correcta"
          : "Revisar diferencias";

  const retryReconciliation = () => {
    const currentRequest = ++requestId.current;
    setReconciliationLoading(true);
    setReconciliationError("");
    void cashService.getReconciliation(session.id).then((result) => {
      if (currentRequest !== requestId.current) return;
      setReconciliation(result);
      setReconciliationLoading(false);
    }).catch((caught: unknown) => {
      if (currentRequest !== requestId.current) return;
      setReconciliationError(caught instanceof Error ? caught.message : "No se pudo consultar la conciliación de este cierre.");
      setReconciliationLoading(false);
    });
  };

  const paymentNumberById = new Map<number, string>();
  reconciliation?.items.forEach((item) => paymentNumberById.set(item.paymentId, item.paymentNumber));
  reconciliation?.orphanMovements.forEach((item) => {
    if (item.paymentId && item.paymentNumber) paymentNumberById.set(item.paymentId, item.paymentNumber);
  });

  return (
    <div
      className="caja-detail-overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        className="caja-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-closure-detail-title"
        aria-describedby="cash-closure-detail-description"
        tabIndex={-1}
      >
        <header className="caja-detail-header">
          <div>
            <span className="caja-detail-eyebrow">HISTORIAL DE CAJA · TURNO #{session.id}</span>
            <h2 id="cash-closure-detail-title">Detalle del cierre</h2>
            <p id="cash-closure-detail-description">
              Revisión de arqueo, movimientos y conciliación del turno de {session.responsable}.
            </p>
          </div>
          <div className="caja-detail-header-actions">
            <span className={`caja-detail-status ${reconciliation?.balanced ? "is-balanced" : reconciliation && !reconciliationLoading && !reconciliationError ? "is-unbalanced" : "is-pending"}`}>
              {reconciliationStatus}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              className="caja-detail-close"
              aria-label="Cerrar detalle del cierre"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className="caja-detail-content">
          <section className="caja-detail-section" aria-labelledby="cash-closure-summary-title">
            <div className="caja-detail-section-heading">
              <div>
                <h3 id="cash-closure-summary-title">Datos del turno</h3>
                <p>Responsables y valores registrados al momento del cierre.</p>
              </div>
            </div>
            <dl className="caja-detail-facts">
              <div><dt>Responsable del turno</dt><dd>{session.responsable || "No disponible"}</dd></div>
              <div><dt>Abierto por</dt><dd>{session.openedByName || "Histórico sin atribución"}</dd></div>
              <div><dt>Cerrado por</dt><dd>{session.closedByName || "Histórico sin atribución"}</dd></div>
              <div><dt>Apertura</dt><dd>{session.apertura || "No disponible"}</dd></div>
              <div><dt>Cierre</dt><dd>{session.cierre || "No disponible"}</dd></div>
              <div><dt>Observaciones</dt><dd>{session.observaciones?.trim() || "Sin observaciones registradas"}</dd></div>
            </dl>
            <div className="caja-detail-metrics">
              <DetailMetric label="Fondo inicial" value={money(session.fondoInicial)} />
              <DetailMetric label="Ingresos en efectivo" value={money(session.ingresosEfectivo)} />
              <DetailMetric label="Ingresos digitales" value={money(session.ingresosDigitales)} />
              <DetailMetric label="Salidas de efectivo" value={`−${money(session.salidasEfectivo)}`} tone="negative" />
              <DetailMetric label="Efectivo esperado" value={money(session.efectivoEsperado)} />
              <DetailMetric
                label="Efectivo contado"
                value={session.efectivoContado === undefined ? "No registrado" : money(session.efectivoContado)}
                note={differenceLabel(difference, session.efectivoContado)}
                tone={differenceTone}
              />
            </div>
            {difference !== undefined && (
              <div className={`caja-detail-difference ${differenceTone === "negative" ? "is-negative" : "is-positive"}`}>
                <span>Diferencia del arqueo</span>
                <strong>{difference > 0 ? "+" : ""}{money(difference)}</strong>
              </div>
            )}
          </section>

          <section className="caja-detail-section" aria-labelledby="cash-closure-reconciliation-title">
            <div className="caja-detail-section-heading">
              <div>
                <h3 id="cash-closure-reconciliation-title">Conciliación de pagos</h3>
                <p>Contrasta los pagos y reversiones con sus movimientos automáticos en Caja.</p>
              </div>
              {reconciliation && !reconciliationLoading && !reconciliationError && (
                <span className={`caja-detail-status ${reconciliation.balanced ? "is-balanced" : "is-unbalanced"}`}>
                  {reconciliation.balanced ? "Sin descuadres" : "Con incidencias"}
                </span>
              )}
            </div>

            {reconciliationLoading && <p className="caja-detail-loading" role="status">Cargando datos de conciliación…</p>}
            {reconciliationError && (
              <div className="caja-detail-error" role="alert">
                <span>{reconciliationError}</span>
                <button type="button" className="caja-secondary" onClick={retryReconciliation}>
                  Reintentar conciliación
                </button>
              </div>
            )}
            {reconciliation && !reconciliationLoading && !reconciliationError && (
              <>
                {!reconciliation.balanced && (
                  <div className="caja-detail-alert is-warning" role="status">
                    <strong>Este cierre requiere revisión.</strong>
                    <span>
                      {reconciliation.mismatchCount} pagos con incidencias · {reconciliation.missingMovementCount} pagos sin movimiento · {reconciliation.orphanMovementCount} movimientos huérfanos.
                    </span>
                  </div>
                )}
                {reconciliation.balanced && (
                  <div className="caja-detail-alert is-success" role="status">
                    <strong>Pagos y movimientos automáticos coinciden.</strong>
                    <span>Los movimientos manuales se muestran por separado y no forman parte de esta conciliación.</span>
                  </div>
                )}
                <div className="caja-detail-recon-metrics">
                  <DetailMetric label="Neto según pagos" value={money(reconciliation.totals.netPayments)} />
                  <DetailMetric label="Neto en movimientos" value={money(reconciliation.totals.netMovements)} />
                  <DetailMetric
                    label="Diferencia de conciliación"
                    value={money(reconciliation.totals.difference)}
                    tone={Math.abs(reconciliation.totals.difference) < 0.005 ? "positive" : "negative"}
                  />
                  <DetailMetric label="Movimientos manuales" value={`${money(reconciliation.totals.manualIncome)} ingreso · ${money(reconciliation.totals.manualOutput)} salida`} />
                </div>

                <h4 className="caja-detail-subtitle">Integridad de acumulados de sesión</h4>
                <div className="caja-detail-table-wrap">
                  <table className="caja-detail-table">
                    <thead><tr><th>Concepto</th><th>Guardado</th><th>Calculado</th><th>Diferencia</th></tr></thead>
                    <tbody>
                      {([
                        ["Ingresos en efectivo", reconciliation.sessionIntegrity.storedCashIncome, reconciliation.sessionIntegrity.computedCashIncome, reconciliation.sessionIntegrity.cashIncomeDifference],
                        ["Ingresos digitales", reconciliation.sessionIntegrity.storedDigitalIncome, reconciliation.sessionIntegrity.computedDigitalIncome, reconciliation.sessionIntegrity.digitalIncomeDifference],
                        ["Salidas de efectivo", reconciliation.sessionIntegrity.storedCashOutput, reconciliation.sessionIntegrity.computedCashOutput, reconciliation.sessionIntegrity.cashOutputDifference],
                        ["Efectivo esperado", reconciliation.sessionIntegrity.storedExpectedCash, reconciliation.sessionIntegrity.computedExpectedCash, reconciliation.sessionIntegrity.expectedCashDifference],
                      ] as Array<[string, number, number, number]>).map(([label, stored, computed, differenceValue]) => (
                        <tr key={label}>
                          <td>{label}</td><td>{money(stored)}</td><td>{money(computed)}</td>
                          <td className={Math.abs(differenceValue) < 0.005 ? "is-balanced" : "is-unbalanced"}>
                            {differenceValue > 0 ? "+" : ""}{money(differenceValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="caja-detail-subtitle">Validación por pago y reversión</h4>
                <div className="caja-detail-table-wrap">
                  <table className="caja-detail-table">
                    <thead><tr><th>Documento</th><th>Registrado por</th><th>Método</th><th>Pago neto</th><th>Movimiento</th><th>Diferencia</th><th>Resultado</th></tr></thead>
                    <tbody>
                      {reconciliation.items.map((item) => (
                        <tr key={item.paymentId}>
                          <td><strong>{item.paymentNumber}</strong><small>{item.kind === "REVERSAL" ? "Reversión" : "Cobro"} · {item.status === "REVERSED" ? "Revertido" : "Publicado"}</small></td>
                          <td>{item.userName || "Usuario no disponible"}</td>
                          <td>{item.method}</td>
                          <td>{money(item.expectedAmount)}</td>
                          <td>{item.movementId === undefined ? "Sin movimiento" : money(item.movementAmount)}</td>
                          <td className={Math.abs(item.difference) < 0.005 ? "is-balanced" : "is-unbalanced"}>
                            {item.difference > 0 ? "+" : ""}{money(item.difference)}
                          </td>
                          <td>{item.issues.length === 0
                            ? <span className="caja-detail-status is-balanced">Correcto</span>
                            : <span className="caja-detail-issues">{item.issues.map((issue) => issueLabels[issue]).join(" · ")}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reconciliation.items.length === 0 && (
                    <p className="caja-detail-empty">No se registraron pagos ni reversiones automáticas en este turno.</p>
                  )}
                </div>

                {reconciliation.orphanMovements.length > 0 && (
                  <>
                    <h4 className="caja-detail-subtitle">Movimientos automáticos sin pago asociado</h4>
                    <div className="caja-detail-table-wrap">
                      <table className="caja-detail-table">
                        <thead><tr><th>Movimiento</th><th>Pago relacionado</th><th>Método</th><th>Usuario</th><th>Importe</th><th>Origen</th></tr></thead>
                        <tbody>{reconciliation.orphanMovements.map((item) => (
                          <tr key={item.movementId}>
                            <td>#{item.movementId}</td><td>{item.paymentNumber || (item.paymentId ? `Pago #${item.paymentId}` : "No asociado")}</td>
                            <td>{item.method}</td><td>{item.userName || "Usuario no disponible"}</td>
                            <td className={item.amount < 0 ? "is-unbalanced" : ""}>{money(item.amount)}</td><td>{item.source === "REVERSAL" ? "Reversión" : "Pago"}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          <section className="caja-detail-section" aria-labelledby="cash-closure-movements-title">
            <div className="caja-detail-section-heading">
              <div>
                <h3 id="cash-closure-movements-title">Libro de movimientos</h3>
                <p>{session.movimientos.length} registros · del más reciente al más antiguo.</p>
              </div>
            </div>
            <div className="caja-detail-table-wrap">
              <table className="caja-detail-table">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto y descripción</th><th>Origen</th><th>Registrado por</th><th>Método</th><th>Pago</th><th>Importe</th></tr></thead>
                <tbody>
                  {session.movimientos.map((movement) => {
                    const paymentNumber = movement.paymentId ? paymentNumberById.get(movement.paymentId) : undefined;
                    return (
                      <tr key={movement.id}>
                        <td>{movement.fecha || "No disponible"}</td>
                        <td><span className={`caja-detail-movement-type ${movement.tipo === "Ingreso" ? "is-income" : "is-expense"}`}>{movement.tipo}</span></td>
                        <td><strong>{movement.concepto}</strong><small>{movement.descripcion || "Sin descripción"}</small></td>
                        <td>{movementSourceLabel(movement.source)}</td>
                        <td>{movement.createdByName || (movement.createdBy ? "Usuario no disponible" : "Histórico sin atribución")}</td>
                        <td>{movement.metodo}</td>
                        <td>{paymentNumber || (movement.paymentId ? `Pago #${movement.paymentId}` : "—")}</td>
                        <td className={movement.tipo === "Salida" ? "is-unbalanced" : "is-balanced"}>
                          {movement.tipo === "Salida" ? "−" : "+"}{money(movement.monto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {session.movimientos.length === 0 && <p className="caja-detail-empty">Este cierre no tiene movimientos registrados.</p>}
            </div>
          </section>
        </div>

        <footer className="caja-detail-footer">
          <span>El detalle es de solo lectura. Los registros históricos sin atribución se mantienen identificados como tales.</span>
          <button type="button" className="caja-primary" onClick={onClose}>Cerrar detalle</button>
        </footer>
      </section>
    </div>
  );
}
