import { useState } from "react";
import type { Pantalla } from "./types";
import AppLayout from "./components/AppLayout";
import Dashboard from "./Dashboard";
import Huespedes from "./Huespedes";
import CuentasCobros from "./CuentasCobros";
import PedidosAlimentos from "./PedidosAlimentos";
import Lavanderia from "./Lavanderia";
import CajaCierres from "./CajaCierres";
import "./App.css";
import "./Login.css";

function App() {
  // Estados del inicio de sesión
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [error, setError] = useState("");

  // Control de navegación
  const [pantalla, setPantalla] = useState<Pantalla>("dashboard");

  // Validación del usuario administrador
  const iniciarSesion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (usuario === "admin" && password === "12345") {
      setAutenticado(true);
      setPantalla("dashboard");
      setError("");
    } else {
      setError("Usuario o contraseña incorrectos (Usa: admin / 12345)");
    }
  };

  const cerrarSesion = () => {
    setAutenticado(false);
    setUsuario("");
    setPassword("");
    setError("");
    setPantalla("dashboard");
  };

  // Navegación entre pantallas
  const navegar = (destino: Pantalla) => {
    setPantalla(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Si el usuario inició sesión, mostramos el layout unificado persistente
  if (autenticado) {
    return (
      <AppLayout
        pantallaActual={pantalla}
        onNavigate={navegar}
        onLogout={cerrarSesion}
      >
        {pantalla === "dashboard" && <Dashboard onNavigate={navegar} />}
        {pantalla === "huespedes" && <Huespedes />}
        {pantalla === "cobros" && <CuentasCobros />}
        {pantalla === "pedidos" && <PedidosAlimentos />}
        {pantalla === "lavanderia" && <Lavanderia />}
        {pantalla === "caja" && <CajaCierres />}
      </AppLayout>
    );
  }

  // Pantalla de inicio de sesión
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">N</div>

        <h1>Nicabliss</h1>
        <p>Sistema de gestión hotelera</p>

        <form onSubmit={iniciarSesion}>
          <label htmlFor="usuario">Usuario</label>

          <input
            id="usuario"
            type="text"
            placeholder="admin"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            type="password"
            placeholder="••••• (12345)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>
        </form>

        <div className="login-hint">
          <small>Credenciales demo: <strong>admin</strong> / <strong>12345</strong></small>
        </div>

        <span className="login-footer">
          Nicabliss © 2026 · Sistema Interno
        </span>
      </div>
    </div>
  );
}

export default App;
