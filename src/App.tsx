
import { useState } from "react";
import Dashboard from "./Dashboard";
import Huespedes from "./Huespedes";
import CuentasCobros from "./CuentasCobros";
import PedidosAlimentos from "./PedidosAlimentos";
import Lavanderia from "./Lavanderia";
import CajaCierres from "./CajaCierres";
import "./App.css";
import "./Login.css";

type Pantalla =
  | "dashboard"
  | "huespedes"
  | "cobros"
  | "pedidos"
  | "lavanderia"
  | "caja";

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
      setError("Usuario o contraseña incorrectos");
    }
  };

  // Navegación entre pantallas
const navegar = (destino: string) => {
  if (
    destino === "dashboard" ||
    destino === "huespedes" ||
    destino === "cobros" ||
    destino === "pedidos" ||
    destino === "lavanderia" ||
    destino === "caja"
  ) {
    setPantalla(destino);
  }
};

  // Si el usuario inició sesión
  if (autenticado) {
    // Pantalla de Huéspedes y Estancias
    if (pantalla === "huespedes") {
      return (
        <div>
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            style={{
              margin: "20px 38px 0",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Volver al Dashboard
          </button>

          <Huespedes />
        </div>
      );
    }

    // Pantalla de Cuentas y Cobros
    if (pantalla === "cobros") {
      return (
        <div>
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            style={{
              margin: "20px 38px 0",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Volver al Dashboard
          </button>

          <CuentasCobros />
        </div>
      );
    }
    if (pantalla === "pedidos") {
  return (
    <div>
      <button
        type="button"
        onClick={() => navegar("dashboard")}
        style={{
          margin: "20px 38px 0",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Volver al Dashboard
      </button>

      <PedidosAlimentos />
    </div>
  );
}
   if (pantalla === "lavanderia") {
      return (
        <div>
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            style={{
              margin: "20px 38px 0",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Volver al Dashboard
          </button>

          <Lavanderia />
        </div>
      );
    }

    // Pantalla de Caja y cierres
    if (pantalla === "caja") {
      return (
        <div>
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            style={{
              margin: "20px 38px 0",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Volver al Dashboard
          </button>

          <CajaCierres />
        </div>
      );
    }

    // Pantalla principal del Dashboard
    return <Dashboard onNavigate={navegar} />;
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
            placeholder="Ingresa tu usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            type="password"
            placeholder="Ingresa tu contraseña"
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

        <span className="login-footer">
          Nicabliss © 2026
        </span>
      </div>
    </div>
  );
}

export default App;

