import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerService } from "../../services/customer.service";
import type { CustomerHistory } from "../../services/types";
import CustomerStayHistory from "./CustomerStayHistory";
import "../features.css";

export default function CustomerDetailPage() {
  const id = Number(useParams().id);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setHistory(await customerService.getHistory(id));
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el cliente");
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (error) return <div className="feature-error">{error}<button onClick={() => void load()}>Reintentar</button></div>;
  if (!history) return <p className="feature-state">Cargando cliente...</p>;

  const { customer } = history;

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div>
          <span>RECEPCIÓN / CLIENTE</span>
          <h1>{customer.nombre} {customer.apellido || ""}</h1>
          <p>{customer.documento} · {history.summary.stayCount} estancia(s) registrada(s)</p>
        </div>
        <div className="feature-actions">
          <Link className="feature-link" to={`/reservations?search=${encodeURIComponent(customer.documento)}`}>Ver reservas</Link>
          <Link className="feature-primary" to={`/reservations/new?customerId=${customer.id}`}>Nueva reserva</Link>
        </div>
      </header>

      <div className="feature-detail-grid">
        <article><span>Documento</span><strong>{customer.documento}</strong></article>
        <article><span>Teléfono</span><strong>{customer.telefono || "No registrado"}</strong></article>
        <article><span>Correo</span><strong>{customer.correo || "No registrado"}</strong></article>
        <article><span>Dirección</span><strong>{customer.direccion || "No registrada"}</strong></article>
      </div>

      <CustomerStayHistory history={history} />

      <Link className="feature-link" to="/customers">← Volver a clientes</Link>
    </section>
  );
}
