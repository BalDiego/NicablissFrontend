import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="status-page">
      <strong>404</strong>
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no corresponde a un módulo de Nicabliss.</p>
      <Link to="/dashboard">Volver al dashboard</Link>
    </main>
  );
}
