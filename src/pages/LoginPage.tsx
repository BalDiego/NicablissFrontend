import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!auth.initializing && auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.login(username.trim(), password);
      const destination = (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(destination, { replace: true });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero" aria-label="Bienvenida a Nicabliss">
        <div className="login-hero-brand"><span>N</span><strong>NICABLISS</strong></div>
        <div className="login-hero-copy">
          <span className="login-eyebrow">HOTEL MANAGEMENT</span>
          <h1>Hospitalidad excepcional,<br />operación impecable.</h1>
          <p>Una plataforma segura para gestionar cada detalle de la experiencia de sus huéspedes.</p>
        </div>
        <div className="login-hero-status"><span /> Acceso exclusivo para personal autorizado</div>
      </section>
      <div className="login-card">
        <div className="login-mobile-brand"><div className="login-logo">N</div><strong>NICABLISS</strong></div>
        <span className="login-card-eyebrow">PORTAL INTERNO</span>
        <h1>Bienvenido de nuevo</h1>
        <p>Ingrese sus credenciales para continuar.</p>
        <form onSubmit={submit}>
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={loading}
            required
            placeholder="Ingrese su usuario"
          />
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
            placeholder="Ingrese su contraseña"
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Autenticando..." : "Iniciar sesión"}
          </button>
        </form>
        <span className="login-footer"><span className="login-secure-dot" /> Conexión segura · Nicabliss Hotel</span>
      </div>
    </div>
  );
}
