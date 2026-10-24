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
      <div className="login-card">
        <div className="login-logo">N</div>
        <h1>Nicabliss</h1>
        <p>Sistema de gestión hotelera</p>
        <form onSubmit={submit}>
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            disabled={loading}
            required
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
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Autenticando..." : "Iniciar sesión"}
          </button>
        </form>
        <span className="login-footer">Nicabliss - Sistema Interno</span>
      </div>
    </div>
  );
}
