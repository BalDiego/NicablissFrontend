import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="status-page">
      <strong>403</strong>
      <h1>Acceso no autorizado</h1>
      <p>Tu rol no tiene permisos para consultar este módulo.</p>
      <Link to="/dashboard">Volver al dashboard</Link>
    </main>
  );
}
