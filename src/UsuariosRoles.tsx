import { useState, useEffect, useCallback } from "react";
import { userService } from "./services/user.service";
import { authService } from "./services/auth.service";
import type { User } from "./services/types";
import "./UsuariosRoles.css";

export default function UsuariosRoles() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"TODOS" | "ADMIN" | "RECEPTIONIST" | "STAFF">("TODOS");

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<User | null>(null);
  const [modalEliminar, setModalEliminar] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Formularios
  const [formNuevo, setFormNuevo] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "RECEPTIONIST" as "ADMIN" | "RECEPTIONIST" | "STAFF",
  });

  const [formEditar, setFormEditar] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "RECEPTIONIST" as "ADMIN" | "RECEPTIONIST" | "STAFF",
  });

  // Notificaciones Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const currentUser = authService.getStoredUser();

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsuarios(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar la lista de usuarios";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Manejo de Creación
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNuevo.fullName.trim() || !formNuevo.username.trim() || !formNuevo.email.trim() || !formNuevo.password.trim()) {
      setFormError("Por favor completa todos los campos requeridos.");
      return;
    }

    if (formNuevo.password.length < 4) {
      setFormError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    try {
      setSubmitting(true);
      await userService.create({
        fullName: formNuevo.fullName.trim(),
        username: formNuevo.username.trim(),
        email: formNuevo.email.trim().toLowerCase(),
        password: formNuevo.password,
        role: formNuevo.role,
      });

      showToast(`Usuario '${formNuevo.username}' registrado exitosamente`, "success");
      setModalCrear(false);
      setFormNuevo({
        fullName: "",
        username: "",
        email: "",
        password: "",
        role: "RECEPTIONIST",
      });
      await cargarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el usuario";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal de Edición
  const abrirEditar = (user: User) => {
    setModalEditar(user);
    setFormError(null);
    setFormEditar({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      password: "", // Opcional en edición
      role: user.role,
    });
  };

  // Manejo de Edición
  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    setFormError(null);

    try {
      setSubmitting(true);
      const payload: { fullName?: string; email?: string; password?: string; role?: "ADMIN" | "RECEPTIONIST" | "STAFF" } = {
        fullName: formEditar.fullName.trim(),
        email: formEditar.email.trim().toLowerCase(),
        role: formEditar.role,
      };

      if (formEditar.password.trim()) {
        if (formEditar.password.trim().length < 4) {
          setFormError("La nueva contraseña debe tener al menos 4 caracteres.");
          setSubmitting(false);
          return;
        }
        payload.password = formEditar.password.trim();
      }

      await userService.update(modalEditar.id, payload);
      showToast(`Usuario '${modalEditar.username}' actualizado correctamente`, "success");
      setModalEditar(null);
      await cargarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar el usuario";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Eliminación
  const handleEliminar = async () => {
    if (!modalEliminar) return;

    try {
      setSubmitting(true);
      await userService.delete(modalEliminar.id);
      showToast(`Usuario '${modalEliminar.username}' eliminado del sistema`, "success");
      setModalEliminar(null);
      await cargarUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar el usuario";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusqueda =
      u.fullName.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase());

    const matchRol = filtroRol === "TODOS" || u.role === filtroRol;

    return matchBusqueda && matchRol;
  });

  // Métricas
  const totalAdmin = usuarios.filter((u) => u.role === "ADMIN").length;
  const totalReceptionist = usuarios.filter((u) => u.role === "RECEPTIONIST").length;
  const totalStaff = usuarios.filter((u) => u.role === "STAFF").length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="usuarios-page">
      {/* Encabezado */}
      <div className="usuarios-heading">
        <div>
          <span className="usuarios-eyebrow">NICABLISS / SEGURIDAD Y CONTROL DE ACCESO</span>
          <h1>Gestión de Usuarios y Roles</h1>
          <p>
            Administración centralizada de cuentas de acceso al PMS hotelero, credenciales seguras y control de privilegios (RBAC).
          </p>
        </div>
        <button
          type="button"
          className="usuarios-primary-btn"
          onClick={() => {
            setFormError(null);
            setModalCrear(true);
          }}
        >
          <span>+</span> Registrar Nuevo Usuario
        </button>
      </div>

      {/* KPI Cards */}
      <div className="usuarios-stats">
        <div className="usuarios-stat-card">
          <div className="usuarios-stat-info">
            <span className="usuarios-stat-label">Total Usuarios</span>
            <strong className="usuarios-stat-number">{usuarios.length}</strong>
            <span className="usuarios-stat-badge badge-slate">Cuentas activas</span>
          </div>
          <div className="usuarios-stat-icon" style={{ background: "#f8fafc", color: "#334155" }}>
            👥
          </div>
        </div>

        <div className="usuarios-stat-card">
          <div className="usuarios-stat-info">
            <span className="usuarios-stat-label">Administradores</span>
            <strong className="usuarios-stat-number">{totalAdmin}</strong>
            <span className="usuarios-stat-badge badge-purple">Acceso Total</span>
          </div>
          <div className="usuarios-stat-icon" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
            🛡️
          </div>
        </div>

        <div className="usuarios-stat-card">
          <div className="usuarios-stat-info">
            <span className="usuarios-stat-label">Recepcionistas</span>
            <strong className="usuarios-stat-number">{totalReceptionist}</strong>
            <span className="usuarios-stat-badge badge-blue">Front Desk</span>
          </div>
          <div className="usuarios-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            🛎️
          </div>
        </div>

        <div className="usuarios-stat-card">
          <div className="usuarios-stat-info">
            <span className="usuarios-stat-label">Personal Operativo</span>
            <strong className="usuarios-stat-number">{totalStaff}</strong>
            <span className="usuarios-stat-badge badge-green">Cocina & Lavandería</span>
          </div>
          <div className="usuarios-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            🧹
          </div>
        </div>
      </div>

      {/* Panel con Tabla y Filtros */}
      <div className="usuarios-panel">
        <div className="usuarios-toolbar">
          <div className="usuarios-search-box">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              className="usuarios-search-input"
              placeholder="Buscar por nombre, usuario o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="usuarios-role-tabs">
            <button
              type="button"
              className={`usuarios-tab-btn ${filtroRol === "TODOS" ? "is-active" : ""}`}
              onClick={() => setFiltroRol("TODOS")}
            >
              Todos ({usuarios.length})
            </button>
            <button
              type="button"
              className={`usuarios-tab-btn ${filtroRol === "ADMIN" ? "is-active" : ""}`}
              onClick={() => setFiltroRol("ADMIN")}
            >
              Admin ({totalAdmin})
            </button>
            <button
              type="button"
              className={`usuarios-tab-btn ${filtroRol === "RECEPTIONIST" ? "is-active" : ""}`}
              onClick={() => setFiltroRol("RECEPTIONIST")}
            >
              Recepción ({totalReceptionist})
            </button>
            <button
              type="button"
              className={`usuarios-tab-btn ${filtroRol === "STAFF" ? "is-active" : ""}`}
              onClick={() => setFiltroRol("STAFF")}
            >
              Staff ({totalStaff})
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="usuarios-table-container">
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              Cargando directorio de usuarios en Turso LibSQL...
            </div>
          ) : error ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#dc2626" }}>
              {error}
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              No se encontraron usuarios coincidentes con el criterio de búsqueda.
            </div>
          ) : (
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol / Permisos</th>
                  <th>Seguridad</th>
                  <th>Fecha de Alta</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const isRootAdmin = u.id === "usr_admin_001" || u.username === "admin";
                  const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar avatar-${u.role.toLowerCase()}`}>
                            {getInitials(u.fullName)}
                          </div>
                          <div className="user-names">
                            <span className="user-full-name">
                              {u.fullName}
                              {isRootAdmin && <span className="badge-root-admin">ADMIN PRINCIPAL</span>}
                              {isSelf && <span className="badge-current-user">TU SESIÓN</span>}
                            </span>
                            <span className="user-username">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "#334155", fontWeight: 500 }}>{u.email}</span>
                      </td>
                      <td>
                        <span className={`role-pill role-${u.role}`}>
                          {u.role === "ADMIN" && "🛡️ Administrador"}
                          {u.role === "RECEPTIONIST" && "🛎️ Recepción"}
                          {u.role === "STAFF" && "🧹 Staff"}
                        </span>
                      </td>
                      <td>
                        <div className="security-cell">
                          <span className="security-status-active">
                            <span className="status-dot" /> Activo
                          </span>
                          <span className="security-hash-info">Cifrado Bcrypt (10r)</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>
                          {new Date(u.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => abrirEditar(u)}
                            title="Modificar datos o resetear contraseña"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            disabled={isRootAdmin || isSelf}
                            onClick={() => setModalEliminar(u)}
                            title={
                              isRootAdmin
                                ? "El Administrador Principal del sistema está protegido"
                                : isSelf
                                ? "No puedes eliminar tu propia cuenta en sesión activa"
                                : "Eliminar usuario del sistema"
                            }
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {modalCrear && (
        <div className="modal-overlay" onClick={() => !submitting && setModalCrear(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nuevo Usuario</h2>
              <button
                type="button"
                className="modal-close-btn"
                disabled={submitting}
                onClick={() => setModalCrear(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrear}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box alert-error">
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="crear-fullname">Nombre Completo *</label>
                  <input
                    id="crear-fullname"
                    type="text"
                    className="form-input"
                    placeholder="Ej: Sofía Morales"
                    value={formNuevo.fullName}
                    onChange={(e) => setFormNuevo({ ...formNuevo, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crear-username">Nombre de Usuario (@username) *</label>
                  <input
                    id="crear-username"
                    type="text"
                    className="form-input"
                    placeholder="Ej: sofia_recepcion"
                    value={formNuevo.username}
                    onChange={(e) => setFormNuevo({ ...formNuevo, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crear-email">Correo Electrónico *</label>
                  <input
                    id="crear-email"
                    type="email"
                    className="form-input"
                    placeholder="sofia@nicabliss.com"
                    value={formNuevo.email}
                    onChange={(e) => setFormNuevo({ ...formNuevo, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crear-password">Contraseña Inicial *</label>
                  <input
                    id="crear-password"
                    type="password"
                    className="form-input"
                    placeholder="Mínimo 4 caracteres"
                    value={formNuevo.password}
                    onChange={(e) => setFormNuevo({ ...formNuevo, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crear-role">Rol y Privilegios en el Sistema *</label>
                  <select
                    id="crear-role"
                    className="form-select"
                    value={formNuevo.role}
                    onChange={(e) => setFormNuevo({ ...formNuevo, role: e.target.value as any })}
                  >
                    <option value="RECEPTIONIST">🛎️ RECEPTIONIST (Huéspedes, Cobros y Turnos)</option>
                    <option value="ADMIN">🛡️ ADMIN (Acceso total, Usuarios y Métricas)</option>
                    <option value="STAFF">🧹 STAFF (Cocina, Comandas y Lavandería)</option>
                  </select>

                  <div className="role-explanation-box">
                    {formNuevo.role === "ADMIN" && (
                      <p><strong>Rol ADMIN:</strong> Acceso irrestricto a gestión de usuarios, auditoría contable, métricas del hotel y cierre de caja.</p>
                    )}
                    {formNuevo.role === "RECEPTIONIST" && (
                      <p><strong>Rol RECEPTIONIST:</strong> Gestión de huéspedes, facturación, comandas y control de turnos de caja chica.</p>
                    )}
                    {formNuevo.role === "STAFF" && (
                      <p><strong>Rol STAFF:</strong> Vista y actualización de comandas de cocina y pedidos de lavandería sin acceso a cobros ni usuarios.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={submitting}
                  onClick={() => setModalCrear(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="usuarios-primary-btn" disabled={submitting}>
                  {submitting ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditar && (
        <div className="modal-overlay" onClick={() => !submitting && setModalEditar(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Usuario: @{modalEditar.username}</h2>
              <button
                type="button"
                className="modal-close-btn"
                disabled={submitting}
                onClick={() => setModalEditar(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditar}>
              <div className="modal-body">
                {formError && (
                  <div className="alert-box alert-error">
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {(modalEditar.id === "usr_admin_001" || modalEditar.username === "admin") && (
                  <div className="alert-box alert-warning">
                    <span>🛡️</span>
                    <span><strong>Administrador Raíz:</strong> Por políticas de seguridad, el rol y nombre de usuario están protegidos contra degradación.</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="edit-fullname">Nombre Completo</label>
                  <input
                    id="edit-fullname"
                    type="text"
                    className="form-input"
                    value={formEditar.fullName}
                    onChange={(e) => setFormEditar({ ...formEditar, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-email">Correo Electrónico</label>
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input"
                    value={formEditar.email}
                    onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-role">Rol Asignado</label>
                  <select
                    id="edit-role"
                    className="form-select"
                    value={formEditar.role}
                    disabled={modalEditar.id === "usr_admin_001" || modalEditar.username === "admin"}
                    onChange={(e) => setFormEditar({ ...formEditar, role: e.target.value as any })}
                  >
                    <option value="RECEPTIONIST">🛎️ RECEPTIONIST (Recepción y Front Desk)</option>
                    <option value="ADMIN">🛡️ ADMIN (Administración Integral)</option>
                    <option value="STAFF">🧹 STAFF (Personal de Operaciones)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-password">Resetear Contraseña (opcional)</label>
                  <input
                    id="edit-password"
                    type="password"
                    className="form-input"
                    placeholder="Dejar en blanco para conservar la actual"
                    value={formEditar.password}
                    onChange={(e) => setFormEditar({ ...formEditar, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={submitting}
                  onClick={() => setModalEditar(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="usuarios-primary-btn" disabled={submitting}>
                  {submitting ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => !submitting && setModalEliminar(null)}>
          <div className="modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button
                type="button"
                className="modal-close-btn"
                disabled={submitting}
                onClick={() => setModalEliminar(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
                ¿Estás seguro de que deseas eliminar permanentemente al usuario{" "}
                <strong style={{ color: "#0f172a" }}>{modalEliminar.fullName}</strong> (@{modalEliminar.username})?
              </p>
              <div className="alert-box alert-error">
                <span>⚠️</span>
                <span>Esta acción revocará inmediatamente sus credenciales de acceso al sistema hotelero.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={submitting}
                onClick={() => setModalEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={submitting}
                onClick={handleEliminar}
              >
                {submitting ? "Eliminando..." : "Sí, Eliminar Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Flotante */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-message toast-${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
