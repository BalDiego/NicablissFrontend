
import { useState } from "react";
import "./Huespedes.css";

type Huesped = {
  id: number;
  nombre: string;
  documento: string;
  habitacion: string;
  entrada: string;
  salida: string;
  estado: "Activo" | "Finalizado" | "Reservado";
};

const huespedesIniciales: Huesped[] = [
  {
    id: 1,
    nombre: "María González",
    documento: "001-150298-0001A",
    habitacion: "Habitación 01",
    entrada: "2026-10-17",
    salida: "2026-10-20",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Carlos Mendoza",
    documento: "001-230195-0002B",
    habitacion: "Habitación 04",
    entrada: "2026-10-18",
    salida: "2026-10-22",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Sophie Laurent",
    documento: "P12345678",
    habitacion: "Habitación 07",
    entrada: "2026-10-15",
    salida: "2026-10-19",
    estado: "Finalizado",
  },
  {
    id: 4,
    nombre: "James Wilson",
    documento: "P87654321",
    habitacion: "Habitación 03",
    entrada: "2026-10-21",
    salida: "2026-10-25",
    estado: "Reservado",
  },
];

function Huespedes() {
  const [huespedes, setHuespedes] = useState(huespedesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevo, setNuevo] = useState({
    nombre: "",
    documento: "",
    habitacion: "",
    entrada: "",
    salida: "",
  });

  const filtrados = huespedes.filter((huesped) =>
    `${huesped.nombre} ${huesped.documento} ${huesped.habitacion}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const registrarHuesped = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (nuevo.salida < nuevo.entrada) {
      alert("La fecha de salida no puede ser anterior a la entrada.");
      return;
    }

    setHuespedes((actuales) => [
      ...actuales,
      {
        id: Date.now(),
        ...nuevo,
        estado: "Activo",
      },
    ]);

    setNuevo({
      nombre: "",
      documento: "",
      habitacion: "",
      entrada: "",
      salida: "",
    });

    setMostrarFormulario(false);
  };

  return (
    <main className="huespedes-page">
      <div className="huespedes-heading">
        <div>
          <span className="huespedes-eyebrow">
            NICABLISS / OPERACIONES
          </span>
          <h1>Huéspedes y estancias</h1>
          <p>
            Consulta y administra los huéspedes registrados
            en el hotel.
          </p>
        </div>

        <button
          className="huespedes-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nuevo huésped
        </button>
      </div>

      <div className="huespedes-stats">
        <div className="huespedes-stat">
          <span>Total de registros</span>
          <strong>{huespedes.length}</strong>
        </div>

        <div className="huespedes-stat">
          <span>Estancias activas</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Activo").length}
          </strong>
        </div>

        <div className="huespedes-stat">
          <span>Reservados</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Reservado").length}
          </strong>
        </div>

        <div className="huespedes-stat">
          <span>Finalizados</span>
          <strong>
            {huespedes.filter((h) => h.estado === "Finalizado").length}
          </strong>
        </div>
      </div>

      <section className="huespedes-panel">
        <div className="huespedes-panel-header">
          <div>
            <h2>Listado de huéspedes</h2>
            <p>Registros de demostración</p>
          </div>

          <input
            type="search"
            placeholder="Buscar huésped, documento o habitación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="huespedes-table-wrap">
          <table className="huespedes-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Documento</th>
                <th>Habitación</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((huesped) => (
                <tr key={huesped.id}>
                  <td className="huespedes-name">
                    {huesped.nombre}
                  </td>
                  <td>{huesped.documento}</td>
                  <td>{huesped.habitacion}</td>
                  <td>{huesped.entrada}</td>
                  <td>{huesped.salida}</td>
                  <td>
                    <span
                      className={`huespedes-status status-${huesped.estado.toLowerCase()}`}
                    >
                      {huesped.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtrados.length === 0 && (
            <p className="huespedes-empty">
              No se encontraron huéspedes.
            </p>
          )}
        </div>
      </section>

      {mostrarFormulario && (
        <div className="huespedes-modal-overlay">
          <div className="huespedes-modal">
            <div className="huespedes-modal-heading">
              <h2>Registrar huésped</h2>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={registrarHuesped}>
              <label>Nombre completo</label>
              <input
                required
                value={nuevo.nombre}
                onChange={(e) =>
                  setNuevo({ ...nuevo, nombre: e.target.value })
                }
              />

              <label>Documento de identidad</label>
              <input
                required
                value={nuevo.documento}
                onChange={(e) =>
                  setNuevo({ ...nuevo, documento: e.target.value })
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
                <option value="">Selecciona una habitación</option>
                {Array.from({ length: 14 }, (_, i) => (
                  <option key={i + 1} value={`Habitación ${String(i + 1).padStart(2, "0")}`}>
                    Habitación {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <label>Fecha de entrada</label>
              <input
                type="date"
                required
                value={nuevo.entrada}
                onChange={(e) =>
                  setNuevo({ ...nuevo, entrada: e.target.value })
                }
              />

              <label>Fecha de salida</label>
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
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="huespedes-primary"
                >
                  Guardar huésped
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
