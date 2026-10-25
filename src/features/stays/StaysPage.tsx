import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stayService } from "../../services/stay.service";
import type { Stay, StayStatus } from "../../services/types";
import "../features.css";

export default function StaysPage() {
  const navigate = useNavigate();
  const [stays, setStays] = useState<Stay[]>([]);
  const [status, setStatus] = useState<StayStatus | "">("Activa");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStays(await stayService.getAll(status || undefined));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar las estancias");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div>
          <span>OPERACIÓN / ESTANCIAS</span>
          <h1>Estancias</h1>
          <p>Huéspedes con check-in, servicios asociados y control de salida.</p>
        </div>
      </header>

      <div className="feature-toolbar">
        <select value={status} onChange={(event) => setStatus(event.target.value as StayStatus | "")}>
          <option value="">Todos los estados</option>
          <option value="Activa">Activas</option>
          <option value="Finalizada">Finalizadas</option>
          <option value="Cancelada">Canceladas</option>
        </select>
      </div>

      {error && <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>}
      <div className="feature-panel">
        <table className="feature-table">
          <thead><tr><th>Estancia</th><th>Huésped</th><th>Habitación</th><th>Check-in</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {stays.map((stay) => (
              <tr key={stay.id}>
                <td><strong>#{stay.id}</strong><small>{stay.reservationCode}</small></td>
                <td><strong>{stay.customerName}</strong><small>{stay.customerDocument}</small></td>
                <td>{stay.habitacion}</td>
                <td>{new Date(stay.checkInAt).toLocaleString("es-NI")}</td>
                <td><span className="feature-badge">{stay.estado}</span></td>
                <td><button className="feature-link" onClick={() => navigate(`/stays/${stay.id}`)}>Ver estancia</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="feature-state">Cargando estancias...</p>}
        {!loading && stays.length === 0 && <p className="feature-state">No hay estancias para este filtro.</p>}
      </div>
    </section>
  );
}
