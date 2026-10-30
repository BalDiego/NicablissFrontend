import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reservationService } from "../../services/reservation.service";
import type { Reservation, ReservationStatus } from "../../services/types";
import "../features.css";

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState(() => params.get("search") ?? "");
  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setReservations(await reservationService.getAll(search, status || undefined)); }
    catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "No se pudieron cargar las reservas"); }
    finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);

  return (
    <section className="feature-page">
      <header className="feature-heading"><div><span>RECEPCIÓN / RESERVAS</span><h1>Reservas</h1><p>Disponibilidad, anticipos y saldos por reserva.</p></div><button className="feature-primary" onClick={() => navigate("/reservations/new")}>+ Nueva reserva</button></header>
      <div className="feature-toolbar"><input placeholder="Código, cliente o documento" value={search} onChange={(event) => setSearch(event.target.value)} /><select value={status} onChange={(event) => setStatus(event.target.value as ReservationStatus | "")}><option value="">Todos los estados</option>{["Pendiente", "Confirmada", "Cancelada", "CheckIn", "Finalizada", "NoShow"].map((item) => <option key={item}>{item}</option>)}</select></div>
      {error && <div className="feature-error">{error}</div>}
      <div className="feature-panel"><table className="feature-table"><thead><tr><th>Reserva</th><th>Cliente</th><th>Habitación</th><th>Fechas</th><th>Total</th><th>Abonado</th><th>Saldo</th><th>Estado</th></tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id} className="clickable" onClick={() => navigate(`/reservations/${reservation.id}`)}><td><strong>{reservation.codigoReserva}</strong></td><td>{reservation.customerName}<small>{reservation.customerDocument}</small></td><td>{reservation.habitacion}</td><td>{reservation.fechaEntrada}<small>hasta {reservation.fechaSalida}</small></td><td>${reservation.totalReserva.toFixed(2)}</td><td>${reservation.abonado.toFixed(2)}</td><td>${reservation.saldo.toFixed(2)}</td><td><span className={`feature-badge status-${reservation.estado.toLowerCase()}`}>{reservation.estado}</span></td></tr>)}</tbody></table>{loading && <p className="feature-state">Cargando reservas...</p>}{!loading && reservations.length === 0 && <p className="feature-state">No se encontraron reservas.</p>}</div>
    </section>
  );
}
