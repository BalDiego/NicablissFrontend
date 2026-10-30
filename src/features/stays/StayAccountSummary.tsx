import { Link } from "react-router-dom";
import type { StayAccount } from "../../services/types";

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function StayAccountSummary({ account }: { account: StayAccount }) {
  return (
    <section className="stay-account-summary" aria-label="Resumen de cuenta de la estancia">
      <header className="stay-account-heading">
        <div>
          <span>CUENTA DE ESTANCIA</span>
          <h2>Resumen antes del check-out</h2>
          <p>Hospedaje y servicios entregados, pagos recibidos y saldo pendiente.</p>
        </div>
        <div className={`stay-account-balance ${account.balance > 0 ? "is-pending" : "is-paid"}`}>
          <span>{account.balance > 0 ? "Saldo pendiente" : "Cuenta sin saldo"}</span>
          <strong>{money(account.balance)}</strong>
        </div>
      </header>

      <div className="stay-account-grid">
        <div><span>Hospedaje</span><strong>{money(account.lodging)}</strong></div>
        <div><span>Servicios entregados</span><strong>{money(account.services)}</strong><small>{account.billableServiceCount} servicio(s)</small></div>
        <div><span>Total de la cuenta</span><strong>{money(account.total)}</strong></div>
        <div><span>Pagos recibidos</span><strong className="positive">{money(account.paid)}</strong></div>
      </div>

      {account.pendingServiceCount > 0 && (
        <div className="stay-account-alert" role="status">
          <span>
            Hay {account.pendingServiceCount} servicio(s) por entregar o cancelar por {money(account.pendingServicesAmount)}.
            La estancia no puede cerrarse hasta resolverlos.
          </span>
          <Link className="feature-link" to={`/stays/${account.stayId}/services`}>Revisar servicios</Link>
        </div>
      )}
    </section>
  );
}
