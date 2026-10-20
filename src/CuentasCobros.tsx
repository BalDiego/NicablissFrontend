
import { useState } from "react";
import "./CuentasCobros.css";

type Estado = "Pagado" | "Pendiente" | "Parcial";

type Cuenta = {
  id: number;
  huesped: string;
  habitacion: string;
  concepto: string;
  total: number;
  pagado: number;
  fecha: string;
};

const cuentasIniciales: Cuenta[] = [
  {
    id: 1001,
    huesped: "María González",
    habitacion: "Habitación 01",
    concepto: "Hospedaje",
    total: 40,
    pagado: 40,
    fecha: "2026-10-19",
  },
  {
    id: 1002,
    huesped: "Carlos Mendoza",
    habitacion: "Habitación 04",
    concepto: "Alimentación",
    total: 12.5,
    pagado: 0,
    fecha: "2026-10-19",
  },
  {
    id: 1003,
    huesped: "Sophie Laurent",
    habitacion: "Habitación 07",
    concepto: "Lavandería",
    total: 8,
    pagado: 3,
    fecha: "2026-10-19",
  },
];

function CuentasCobros() {
  const [cuentas, setCuentas] = useState(cuentasIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const estadoDe = (cuenta: Cuenta): Estado => {
    if (cuenta.pagado >= cuenta.total) return "Pagado";
    if (cuenta.pagado > 0) return "Parcial";
    return "Pendiente";
  };

  const totalFacturado = cuentas.reduce(
    (suma, cuenta) => suma + cuenta.total, 0
  );
  const totalCobrado = cuentas.reduce(
    (suma, cuenta) => suma + cuenta.pagado, 0
  );
  const saldoPendiente = totalFacturado - totalCobrado;

  const cuentasFiltradas = cuentas.filter((cuenta) =>
    `${cuenta.huesped} ${cuenta.habitacion} ${cuenta.concepto}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const registrarCuenta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const total = Number(nuevo.total);

    if (!Number.isFinite(total) || total <= 0) {
      alert("Ingresa un importe válido.");
      return;
    }

    setCuentas((anteriores) => [
      ...anteriores,
      {
        id: Date.now(),
        huesped: nuevo.huesped.trim(),
        habitacion: nuevo.habitacion,
        concepto: nuevo.concepto,
        total,
        pagado: 0,
        fecha: new Date().toLocaleDateString("en-CA"),
      },
    ]);

    setNuevo({
      huesped: "",
      habitacion: "",
      concepto: "Hospedaje",
      total: "",
    });
    setMostrarFormulario(false);
  };

  const registrarPago = (id: number) => {
    const cuenta = cuentas.find((item) => item.id === id);
    if (!cuenta) return;

    const pendiente = Number(
      (cuenta.total - cuenta.pagado).toFixed(2)
    );
    const respuesta = window.prompt(
      `Saldo pendiente: ${moneda(pendiente)}\nImporte a cobrar:`
    );

    if (respuesta === null) return;
    const texto = respuesta.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
      alert("Ingresa un importe válido con máximo 2 decimales.");
      return;
    }

    const importe = Number(texto);
    if (importe <= 0 || importe > pendiente) {
      alert("El pago debe ser mayor que cero y no superar el saldo.");
      return;
    }

    setCuentas((anteriores) =>
      anteriores.map((item) =>
        item.id === id
          ? {
              ...item,
              pagado: Number(
                (item.pagado + importe).toFixed(2)
              ),
            }
          : item
      )
    );
  };

  return (
    <main className="cobros-page">
      <div className="cobros-heading">
        <div>
          <span className="cobros-eyebrow">
            NICABLISS / FINANZAS
          </span>
          <h1>Cuentas y cobros</h1>
          <p>
            Control de cargos, pagos y saldos de huéspedes.
          </p>
        </div>
        <button
          className="cobros-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo cargo
        </button>
      </div>

      <div className="cobros-stats">
        <article className="cobros-stat">
          <span>Total facturado</span>
          <strong>{moneda(totalFacturado)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Total cobrado</span>
          <strong>{moneda(totalCobrado)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Saldo pendiente</span>
          <strong>{moneda(saldoPendiente)}</strong>
        </article>
        <article className="cobros-stat">
          <span>Cuentas abiertas</span>
          <strong>
            {cuentas.filter((c) => c.pagado < c.total).length}
          </strong>
        </article>
      </div>

      <section className="cobros-panel">
        <div className="cobros-panel-header">
          <div>
            <h2>Movimientos registrados</h2>
            <p>Consulta y seguimiento de cobros</p>
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
              {cuentasFiltradas.map((cuenta) => {
                const pendiente = Number(
                  (cuenta.total - cuenta.pagado).toFixed(2)
                );
                const estado = estadoDe(cuenta);

                return (
                  <tr key={cuenta.id}>
                    <td>
                      <strong>{cuenta.huesped}</strong>
                      <small>{cuenta.habitacion}</small>
                    </td>
                    <td>{cuenta.concepto}</td>
                    <td>{moneda(cuenta.total)}</td>
                    <td>{moneda(cuenta.pagado)}</td>
                    <td>{moneda(pendiente)}</td>
                    <td>
                      <span
                        className={`cobros-status cobros-${estado.toLowerCase()}`}
                      >
                        {estado}
                      </span>
                    </td>
                    <td>
                      <button
                        className="cobros-action"
                        disabled={pendiente <= 0}
                        onClick={() => registrarPago(cuenta.id)}
                      >
                        {pendiente <= 0 ? "Pagado" : "Cobrar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {cuentasFiltradas.length === 0 && (
            <p className="cobros-empty">
              No se encontraron movimientos.
            </p>
          )}
        </div>
      </section>

      <p className="cobros-notice">
        Datos de demostración. Los registros y pagos todavía
        no se guardan en la base de datos.
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
                ✕
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
              />

              <div className="cobros-modal-actions">
                <button
                  type="button"
                  className="cobros-cancel"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="cobros-primary">
                  Guardar cargo
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
