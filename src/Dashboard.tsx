import './App.css'


const stats = [
  {
    label: 'Ingresos del día',
    value: '$ 284.00',
    detail: 'Pagos registrados hoy',
    icon: '$',
    className: 'stat-green',
  },
  {
    label: 'Cuentas abiertas',
    value: '8',
    detail: 'Huéspedes con saldo activo',
    icon: '≡',
    className: 'stat-blue',
  },
  {
    label: 'Pedidos pendientes',
    value: '3',
    detail: 'Solicitudes por atender',
    icon: '↗',
    className: 'stat-orange',
  },
  {
    label: 'Lavandería pendiente',
    value: '2',
    detail: 'Solicitudes en proceso',
    icon: '◈',
    className: 'stat-purple',
  },
]

const transactions = [
  {
    guest: 'María González',
    service: 'Hospedaje',
    date: 'Hoy, 09:42 AM',
    amount: '$ 40.00',
    status: 'Completado',
  },
  {
    guest: 'Carlos Mendoza',
    service: 'Alimentación',
    date: 'Hoy, 09:18 AM',
    amount: '$ 12.50',
    status: 'Completado',
  },
  {
    guest: 'Sophie Laurent',
    service: 'Lavandería',
    date: 'Hoy, 08:56 AM',
    amount: '$ 8.00',
    status: 'Pendiente',
  },
  {
    guest: 'James Wilson',
    service: 'Hospedaje',
    date: 'Hoy, 08:30 AM',
    amount: '$ 20.00',
    status: 'Completado',
  },
]

const pendingOrders = [
  {
    id: '#PED-024',
    guest: 'María González',
    detail: '2 desayunos americanos',
    time: '09:35 AM',
    status: 'Pendiente',
  },
  {
    id: '#PED-023',
    guest: 'Carlos Mendoza',
    detail: '1 sándwich + 1 café',
    time: '09:20 AM',
    status: 'Preparando',
  },
  {
    id: '#PED-022',
    guest: 'Sophie Laurent',
    detail: '1 desayuno continental',
    time: '09:05 AM',
    status: 'Listo',
  },
]

type DashboardProps = {
  onNavigate: (destino: string) => void;
};

function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">N</div>
          <div>
            <h1>NICABLISS</h1>
            <span>HOTEL MANAGEMENT</span>
          </div>
        </div>

        <div className="sidebar-section-label">MENÚ PRINCIPAL</div>

        <nav className="sidebar-nav" aria-label="Menú principal">
          <a href="#dashboard" className="nav-link active">
            <span className="nav-icon">▦</span>
            Dashboard
          </a>
         <a
  href="#huespedes"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    onNavigate("huespedes");
  }}
>
            <span className="nav-icon">♙</span>
            Huéspedes y estancias
          </a>
          <a
            href="#cuentas"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("cobros");
            }}
          >
            <span className="nav-icon">$</span>
            Cuentas y cobros
          </a>
         <a
  href="#pedidos"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    onNavigate("pedidos");
  }}
>
            <span className="nav-icon">▤</span>
            Pedidos de alimentos
            <span className="nav-badge">3</span>
          </a>
         <a
  href="#lavanderia"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    onNavigate("lavanderia");
  }}
>
  <span className="nav-icon">◈</span>
  Lavandería
</a>
          <a
  href="#caja"
  className="nav-link"
  onClick={(e) => {
    e.preventDefault();
    onNavigate("caja");
  }}
>
  <span className="nav-icon">▣</span>
  Caja y cierres
</a>
          <a
            href="#reportes"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("reportes");
            }}
          >
            <span className="nav-icon">▥</span>
            Reportes
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-section-label">SISTEMA</div>
          <a href="#usuarios" className="nav-link">
            <span className="nav-icon">⚙</span>
            Configuración
          </a>

          <div className="sidebar-user">
            <div className="user-avatar">AD</div>
            <div className="sidebar-user-info">
              <strong>Administrador</strong>
              <span>Administrador</span>
            </div>
            <button
              type="button"
              className="user-menu-button"
              aria-label="Opciones del usuario"
              title="Opciones del usuario"
            >
              ⋯
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main" id="dashboard">
        <header className="dashboard-header">
          <div className="breadcrumb">
            <span>Nicabliss</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Dashboard</strong>
          </div>

          <div className="header-actions">
            <div className="system-status">
              <span className="status-dot" />
              Sistema operativo
            </div>
            <button
              className="notification-button"
              type="button"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              ♧
              <span className="notification-indicator" />
            </button>
            <div className="header-avatar">AD</div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading">
            <div>
              <span className="page-eyebrow">SÁBADO · RECEPCIÓN</span>
              <h2>Resumen general</h2>
              <p>
                Bienvenido al panel de gestión de Nicabliss.
                Aquí tienes el resumen de las operaciones del día.
              </p>
            </div>

            <button
              type="button"
              className="date-button"
              onClick={() => window.print()}
            >
              <span>▦</span>
              Reporte / Imprimir
            </button>
          </section>

          <section className="stats-grid" aria-label="Indicadores principales">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-card-top">
                  <span className="stat-label">{stat.label}</span>
                  <span className={`stat-icon ${stat.className}`}>
                    {stat.icon}
                  </span>
                </div>
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-detail">{stat.detail}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel transactions-panel">
              <div className="panel-header">
                <div>
                  <h3>Transacciones recientes</h3>
                  <p>Últimos movimientos registrados</p>
                </div>
                <a
                  href="#cuentas"
                  className="panel-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("cobros");
                  }}
                >
                  Ver todas <span>→</span>
                </a>
              </div>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Huésped</th>
                      <th>Servicio</th>
                      <th>Fecha</th>
                      <th>Importe</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={`${transaction.guest}-${transaction.service}`}>
                        <td>
                          <div className="guest-cell">
                            <span className="guest-avatar">
                              {transaction.guest
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                            <strong>{transaction.guest}</strong>
                          </div>
                        </td>
                        <td>{transaction.service}</td>
                        <td className="date-cell">{transaction.date}</td>
                        <td className="amount-cell">{transaction.amount}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              transaction.status === 'Completado'
                                ? 'status-complete'
                                : 'status-pending'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                Mostrando 4 transacciones de ejemplo
              </div>
            </article>

            <article className="panel orders-panel">
              <div className="panel-header">
                <div>
                  <h3>Pedidos de alimentos</h3>
                  <p>Seguimiento de solicitudes</p>
                </div>
               <a
  href="#pedidos"
  className="panel-link"
  onClick={(e) => {
    e.preventDefault();
    onNavigate("pedidos");
  }}
>
  Ver todos <span>→</span>
</a>
              </div>

              <div className="orders-list">
                {pendingOrders.map((order) => (
                  <div className="order-item" key={order.id}>
                    <div className="order-top">
                      <strong>{order.id}</strong>
                      <span
                        className={`order-status ${
                          order.status === 'Pendiente'
                            ? 'order-waiting'
                            : order.status === 'Preparando'
                              ? 'order-preparing'
                              : 'order-ready'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="order-guest">{order.guest}</div>
                    <div className="order-detail">{order.detail}</div>
                    <div className="order-time">
                      <span>Hora de solicitud</span>
                      <span>{order.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="bottom-notice">
            <div className="notice-icon">i</div>
            <div>
              <strong>Información del sistema</strong>
              <p>
                Los datos mostrados son de demostración. Las cifras y
                operaciones reales se habilitarán al conectar el backend.
              </p>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 Nicabliss · Sistema de gestión interna</span>
            <span>Panel administrativo</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default Dashboard