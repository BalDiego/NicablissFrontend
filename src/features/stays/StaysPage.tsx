import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFeedback } from "../../hooks/useFeedback";
import { reservationService } from "../../services/reservation.service";
import { stayService } from "../../services/stay.service";
import type { Reservation, Stay, StayStatus } from "../../services/types";
import "../features.css";

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export default function StaysPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify, confirm } = useFeedback();
  const [stays, setStays] = useState<Stay[]>([]);
  const [status, setStatus] = useState<StayStatus | "">("Activa");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const canManageArrivals = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

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

  const loadReservations = useCallback(async () => {
    setArrivalLoading(true);
    setArrivalError("");
    try {
      const data = await reservationService.getAll();
      setReservations(data
        .filter((reservation) => reservation.estado === "Confirmada")
        .sort((first, second) => first.fechaEntrada.localeCompare(second.fechaEntrada)));
    } catch (caught: unknown) {
      setArrivalError(caught instanceof Error ? caught.message : "No se pudieron cargar las reservas");
    } finally {
      setArrivalLoading(false);
    }
  }, []);

  const openArrival = () => {
    setArrivalOpen(true);
    setArrivalSearch("");
    void loadReservations();
  };

  const matchingReservations = useMemo(() => {
    const query = normalizeSearch(arrivalSearch.trim());
    if (!query) return reservations;
    return reservations.filter((reservation) => [
      reservation.customerName,
      reservation.customerDocument,
      reservation.codigoReserva,
      reservation.habitacion,
    ].some((value) => normalizeSearch(value).includes(query)));
  }, [arrivalSearch, reservations]);

  const checkIn = async (reservation: Reservation) => {
    if (checkingInId !== null) return;
    if (!(await confirm(`¿Registrar la llegada de ${reservation.customerName} a ${reservation.habitacion}?`))) return;

    setCheckingInId(reservation.id);
    try {
      const stay = await reservationService.checkIn(reservation.id);
      notify("Llegada registrada. Ya puedes agregar servicios.");
      navigate(`/stays/${stay.id}/services`);
    } catch (caught: unknown) {
      notify(caught instanceof Error ? caught.message : "No se pudo registrar el check-in", "error");
      setCheckingInId(null);
      void loadReservations();
    }
  };

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
        {canManageArrivals && (
          <div className="feature-actions">
            <button className="feature-primary" onClick={openArrival}>Registrar llegada</button>
            <button onClick={() => navigate("/reservations/new?checkInNow=1")}>Llegada sin reserva</button>
          </div>
        )}
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

      {arrivalOpen && (
        <div className="feature-overlay" role="presentation">
          <section className="feature-modal stays-arrival-modal" role="dialog" aria-modal="true" aria-labelledby="arrival-modal-title">
            <header>
              <div>
                <h2 id="arrival-modal-title">Registrar llegada</h2>
                <p>Busca una reserva confirmada para crear su estancia y continuar con los servicios.</p>
              </div>
              <button type="button" onClick={() => setArrivalOpen(false)} aria-label="Cerrar">×</button>
            </header>

            <div className="stays-arrival-content">
              <label className="stays-arrival-search">
                Buscar huésped, documento, reserva o habitación
                <input
                  type="search"
                  value={arrivalSearch}
                  onChange={(event) => setArrivalSearch(event.target.value)}
                  placeholder="Ej. María González o RES-2026-000001"
                  autoFocus
                />
              </label>

              {arrivalError && <div className="feature-error" role="alert">{arrivalError}<button onClick={() => void loadReservations()}>Reintentar</button></div>}
              {arrivalLoading && <p className="feature-state">Cargando reservas confirmadas…</p>}

              {!arrivalLoading && !arrivalError && matchingReservations.length > 0 && (
                <div className="stays-arrival-list" aria-label="Reservas confirmadas">
                  {matchingReservations.map((reservation) => (
                    <article className="stays-arrival-item" key={reservation.id}>
                      <div>
                        <strong>{reservation.customerName}</strong>
                        <span>{reservation.habitacion} · {reservation.codigoReserva}</span>
                        <small>Entrada: {reservation.fechaEntrada} · Documento: {reservation.customerDocument}</small>
                      </div>
                      <button
                        type="button"
                        className="feature-primary"
                        disabled={checkingInId !== null}
                        onClick={() => void checkIn(reservation)}
                      >
                        {checkingInId === reservation.id ? "Registrando…" : "Registrar check-in"}
                      </button>
                    </article>
                  ))}
                </div>
              )}

              {!arrivalLoading && !arrivalError && matchingReservations.length === 0 && (
                <p className="feature-state">
                  {reservations.length === 0
                    ? "No hay reservas confirmadas disponibles. Puedes iniciar una llegada sin reserva."
                    : "No encontramos reservas con esa búsqueda."}
                </p>
              )}

              <p className="stays-arrival-hint">Solo se muestran reservas confirmadas. Las reservas pendientes deben confirmarse antes del check-in.</p>
              <footer>
                <button type="button" onClick={() => setArrivalOpen(false)}>Cerrar</button>
                <button type="button" className="feature-primary" onClick={() => navigate("/reservations/new?checkInNow=1")}>
                  Llegada sin reserva
                </button>
              </footer>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
