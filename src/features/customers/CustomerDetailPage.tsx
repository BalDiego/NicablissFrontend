import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerService } from "../../services/customer.service";
import type { Customer } from "../../services/types";
import "../features.css";

export default function CustomerDetailPage() {
  const id = Number(useParams().id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerService.getById(id).then(setCustomer).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el cliente");
    });
  }, [id]);

  if (error) return <div className="feature-error">{error}</div>;
  if (!customer) return <p className="feature-state">Cargando cliente...</p>;

  return (
    <section className="feature-page">
      <header className="feature-heading">
        <div><span>RECEPCIÓN / CLIENTE</span><h1>{customer.nombre} {customer.apellido || ""}</h1><p>{customer.documento}</p></div>
        <Link className="feature-primary" to={`/reservations/new?customerId=${customer.id}`}>Crear reserva</Link>
      </header>
      <div className="feature-detail-grid">
        <article><span>Documento</span><strong>{customer.documento}</strong></article>
        <article><span>Teléfono</span><strong>{customer.telefono || "No registrado"}</strong></article>
        <article><span>Correo</span><strong>{customer.correo || "No registrado"}</strong></article>
        <article><span>Dirección</span><strong>{customer.direccion || "No registrada"}</strong></article>
      </div>
      <Link className="feature-link" to="/customers">← Volver a clientes</Link>
    </section>
  );
}
