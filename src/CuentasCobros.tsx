import { useState, useEffect, useCallback } from "react";
import { billingService } from "./services/billing.service";
import type { BillingAccount, BillingSummary } from "./services/types";
import "./CuentasCobros.css";

function CuentasCobros() {
  const [cuentas, setCuentas] = useState<BillingAccount[]>([]);
  const [resumen, setResumen] = useState<BillingSummary>({
    totalFacturado: 0,
    totalCobrado: 0,
    saldoPendiente: 0,
  });
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [cuentaParaCobro, setCuentaParaCobro] = useState<BillingAccount | null>(null);
  const [montoPago, setMontoPago] = useState("");

  const [nuevo, setNuevo] = useState({
    huesped: "",
    habitacion: "",
    concepto: "Hospedaje",
    total: "",
  });

  const moneda = (valor: number) =>
    valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const cargarCuentas = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingService.getAll(query);
      setCuentas(data.cuentas);
      setResumen(data.resumen);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar las cuentas.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarCuentas(busqueda);
    }, 250);
    return () => clearTimeout(timer);
  }, [busqueda, cargarCuentas]);

  const registrarCuenta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total = Number(nuevo.total);

    if (!Number.isFinite(total) || total <= 0) {
      alert("Ingresa un importe válido.");
      return;
    }

    try {
      setSubmitting(true);
      await billingService.create({
        huesped: nuevo.huesped.trim(),
        habitacion: nuevo.habitacion,
        concepto: nuevo.concepto,
        total,
      });

      setNuevo({
        huesped: "",
        habitacion: "",
        concepto: "Hospedaje",
        total: "",
      });
      setMostrarFormulario(false);
      await cargarCuentas(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el cargo.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const abrirModalCobro = (cuenta: BillingAccount) => {
    setCuentaParaCobro(cuenta);
    setMontoPago(cuenta.saldo.toFixed(2));
    setMostrarModalPago(true);
  };

  const ejecutarCobro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cuentaParaCobro) return;

    const importe = Number(montoPago);
    if (!Number.isFinite(importe) || importe <= 0) {
      alert("Ingresa un monto válido.");
      return;
    }

    if (importe > cuentaParaCobro.saldo) {
      alert(`El monto no puede superar el saldo pendiente (${moneda(cuentaParaCobro.saldo)}).`);
      return;
    }

    try {
      setSubmitting(true);
      await billingService.recordPayment(cuentaParaCobro.id, importe);
      setMostrarModalPago(false);
      setCuentaParaCobro(null);
      setMontoPago("");
      await cargarCuentas(busqueda);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el cobro.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cuentasAbiertas = cuentas.filter((c) => c.saldo > 0).length;

  return (
    <main className="cobros-page">
      <div className="cobros-heading">
        <div>
          <span className="cobros-eyebrow">
            NICABLISS / FINANZAS
          </span>
          <h1>Cuentas y cobros</h1>
          <p>
            Control de cargos, pagos y saldos de huéspedes en tiempo real.
          </p>
        </div>
        <button
          className="cobros-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo cargo
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
            onClick={() => cargarCuentas(busqueda)}
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

      <div className="cobros-stats">
        <article className="cobros-stat">
          <span>Total facturado</span>
          <strong>{moneda(resumen.totalFacturado)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Total cobrado</span>
          <strong>{moneda(resumen.totalCobrado)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Saldo pendiente</span>
          <strong>{moneda(resumen.saldoPendiente)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Cuentas abiertas</span>
          <strong>{cuentasAbiertas}</strong>
        </article>
      </div>

      <section className="cobros-panel">
        <div className="cobros-panel-header">
          <div>
            <h2>Movimientos registrados</h2>
            <p>Consulta y seguimiento de cobros en el servidor central</p>
          </div>
          <input
            type="search"
            placeholder="Buscar huésped, habitación o servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="cobros-table-wrap">
          <table className="cobros-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Concepto</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td>
                    <strong>{cuenta.huesped}</strong>
                    <small>{cuenta.habitacion}</small>
                  </td>
                  <td>{cuenta.concepto}</td>
                  <td>{moneda(cuenta.total)}</td>
                  <td>{moneda(cuenta.pagado)}</td>
                  <td>{moneda(cuenta.saldo)}</td>
                  <td>
                    <span
                      className={`cobros-status cobros-${cuenta.estado.toLowerCase()}`}
                    >
                      {cuenta.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="cobros-action"
                      disabled={cuenta.saldo <= 0}
                      onClick={() => abrirModalCobro(cuenta)}
                    >
                      {cuenta.saldo <= 0 ? "Pagado" : "Cobrar"}
                    </button>
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

          {!loading && cuentas.length === 0 && (
            <p className="cobros-empty">
              No se encontraron cuentas o movimientos registrados.
            </p>
          )}
        </div>
      </section>

      <p className="cobros-notice">
        Cuentas sincronizadas directamente con Nicabliss API. Las transacciones se asientan de manera inmediata.
      </p>

      {mostrarFormulario && (
        <div className="cobros-overlay">
          <div className="cobros-modal">
            <div className="cobros-modal-header">
              <h2>Registrar nuevo cargo</h2>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
              >
                x
              </button>
            </div>
            <form onSubmit={registrarCuenta}>
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

              <label>Concepto</label>
              <select
                value={nuevo.concepto}
                onChange={(e) =>
                  setNuevo({ ...nuevo, concepto: e.target.value })
                }
              >
                <option>Hospedaje</option>
                <option>Alimentación</option>
                <option>Lavandería</option>
                <option>Otro servicio</option>
              </select>

              <label>Importe (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={nuevo.total}
                onChange={(e) =>
                  setNuevo({ ...nuevo, total: e.target.value })
                }
                placeholder="0.00"
              />

              <div className="cobros-modal-actions">
                <button
                  type="button"
                  className="cobros-cancel"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cobros-primary"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar cargo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPago && cuentaParaCobro && (
        <div className="cobros-overlay">
          <div className="cobros-modal">
            <div className="cobros-modal-header">
              <h2>Registrar pago / abono</h2>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalPago(false);
                  setCuentaParaCobro(null);
                }}
              >
                x
              </button>
            </div>
            <form onSubmit={ejecutarCobro}>
              <div style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Huésped:</strong> {cuentaParaCobro.huesped} ({cuentaParaCobro.habitacion})
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Concepto:</strong> {cuentaParaCobro.concepto}
                </p>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Total:</strong> {moneda(cuentaParaCobro.total)} | <strong>Pagado:</strong> {moneda(cuentaParaCobro.pagado)}
                </p>
                <p style={{ margin: "0.25rem 0", color: "#10b981", fontWeight: 600 }}>
                  <strong>Saldo restante:</strong> {moneda(cuentaParaCobro.saldo)}
                </p>
              </div>

              <label>Monto a pagar (USD)</label>
              <input
                type="number"
                min="0.01"
                max={cuentaParaCobro.saldo}
                step="0.01"
                required
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
              />

              <div className="cobros-modal-actions">
                <button
                  type="button"
                  className="cobros-cancel"
                  onClick={() => {
                    setMostrarModalPago(false);
                    setCuentaParaCobro(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cobros-primary"
                  disabled={submitting}
                >
                  {submitting ? "Procesando..." : "Confirmar cobro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default CuentasCobros;
