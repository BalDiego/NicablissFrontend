import { useState, useEffect } from "react";
import type { Pantalla } from "./types";
import AppLayout from "./components/AppLayout";
import Dashboard from "./Dashboard";
import Huespedes from "./Huespedes";
import CuentasCobros from "./CuentasCobros";
import PedidosAlimentos from "./PedidosAlimentos";
import Lavanderia from "./Lavanderia";
import CajaCierres from "./CajaCierres";
import { authService } from "./services/auth.service";
import "./App.css";
import "./Login.css";

function App() {
  // Estados del inicio de sesión
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Control de navegación
  const [pantalla, setPantalla] = useState<Pantalla>("dashboard");

  // Al montar la aplicación, verificar si ya existe una sesión activa y válida
  useEffect(() => {
    const verificarSesion = async () => {
      const token = authService.getStoredToken();
      if (!token) {
        setVerificandoSesion(false);
        return;
      }

      try {
        await authService.getProfile();
        setAutenticado(true);
      } catch {
        authService.logout();
        setAutenticado(false);
      } finally {
        setVerificandoSesion(false);
      }
    };

    verificarSesion();

    // Escuchar eventos de sesión expirada
    const handleSessionExpired = () => {
      setAutenticado(false);
      setError("Tu sesión ha expirado. Por favor ingresa tus credenciales nuevamente.");
    };

    window.addEventListener("nicabliss:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("nicabliss:session-expired", handleSessionExpired);
    };
  }, []);

  // Inicio de sesión contra la API REST
  const iniciarSesion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await authService.login(usuario.trim(), password);
      setAutenticado(true);
      setPantalla("dashboard");
      setError("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Usuario o contraseña incorrectos";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    authService.logout();
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

  if (verificandoSesion) {
    return (
      <div className="login-page">
        <div style={{ textAlign: "center", color: "#193c31", fontWeight: 600 }}>
          <p>Verificando sesión segura de Nicabliss...</p>
        </div>
      </div>
    );
  }

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
            disabled={cargando}
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            type="password"
            placeholder="12345"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={cargando}
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={cargando}>
            {cargando ? "Autenticando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="login-hint">
          <small>Credenciales del sistema: <strong>admin</strong> / <strong>12345</strong></small>
        </div>

        <span className="login-footer">
          Nicabliss - Sistema Interno
        </span>
      </div>
    </div>
  );
}

export default App;
