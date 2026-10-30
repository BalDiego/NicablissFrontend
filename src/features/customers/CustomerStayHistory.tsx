import { Link } from "react-router-dom";
import type { CustomerHistory } from "../../services/types";

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-NI");
}

export default function CustomerStayHistory({ history }: { history: CustomerHistory }) {
  const { activeStay, stays, summary } = history;
  const staysWithPayments = stays.filter((stay) => (stay.payments?.length ?? 0) > 0);

  return (
    <>
      <section className="feature-detail-grid customer-history-summary" aria-label="Resumen del cliente">
        <article><span>Estancias</span><strong>{summary.stayCount}</strong></article>
        <article><span>Total histórico</span><strong>{money(summary.totalCharged)}</strong></article>
        <article><span>Total pagado</span><strong>{money(summary.totalPaid)}</strong></article>
        <article>
          <span>Saldo pendiente</span>
          <strong className={summary.outstandingBalance > 0 ? "negative" : "positive"}>
            {money(summary.outstandingBalance)}
          </strong>
        </article>
      </section>

      {activeStay && (
        <article className="customer-active-stay">
          <div className="customer-active-stay-heading">
            <div>
              <span>ESTANCIA ACTUAL</span>
              <h2>Estancia #{activeStay.stayId} · {activeStay.habitacion}</h2>
              <p>Check-in {formatDate(activeStay.checkInAt)} · Reserva {activeStay.reservationCode}</p>
            </div>
            <Link className="feature-primary" to={`/stays/${activeStay.stayId}`}>Ver estancia activa</Link>
          </div>
          <div className="customer-active-stay-metrics">
            <div><span>Total cuenta</span><strong>{money(activeStay.total)}</strong></div>
            <div><span>Pagado</span><strong className="positive">{money(activeStay.paid)}</strong></div>
            <div><span>Saldo</span><strong className={activeStay.balance > 0 ? "negative" : "positive"}>{money(activeStay.balance)}</strong></div>
            <div>
              <span>Servicios pendientes</span>
              <strong>{activeStay.pendingServiceCount}</strong>
              {activeStay.pendingServiceCount > 0 && <small>{money(activeStay.pendingServicesAmount)} por entregar</small>}
            </div>
          </div>
        </article>
      )}

      <div className="feature-section-title">
        <div>
          <h2>Historial de estancias</h2>
          <p>La estancia activa se mantiene separada de las estancias ya cerradas.</p>
        </div>
      </div>

      <div className="feature-panel">
        <table className="feature-table">
          <thead>
            <tr>
              <th>Estancia</th>
              <th>Habitación</th>
              <th>Fechas</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {stays.map((stay) => (
              <tr key={stay.stayId}>
                <td>
                  <strong>#{stay.stayId}</strong>
                  <small>{stay.reservationCode}</small>
                </td>
                <td>
                  {stay.habitacion}
                  {stay.pendingServiceCount > 0 && <small>{stay.pendingServiceCount} servicio(s) pendiente(s)</small>}
                </td>
                <td>
                  {formatDate(stay.checkInAt)}
                  <small>{stay.checkOutAt ? `Salida ${formatDate(stay.checkOutAt)}` : "En hospedaje"}</small>
                </td>
                <td><span className="feature-badge">{stay.status}</span></td>
                <td>{money(stay.total)}</td>
                <td className="positive">{money(stay.paid)}</td>
                <td className={stay.balance > 0 ? "negative" : "positive"}>{money(stay.balance)}</td>
                <td>
                  <div className="customer-stay-actions">
                    {stay.balance > 0 && <Link className="feature-link" to={`/reservations/${stay.reservationId}`}>Cobrar saldo</Link>}
                    <Link className="feature-link" to={`/stays/${stay.stayId}`}>Ver detalle</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {stays.length === 0 && (
          <p className="feature-state">
            Este cliente todavía no tiene estancias. Crea una reserva para iniciar su primer hospedaje.
          </p>
        )}
      </div>

      {staysWithPayments.length > 0 && (
        <>
          <div className="feature-section-title">
            <div>
              <h2>Pagos por estancia</h2>
              <p>Incluye anticipos, cobros posteriores al check-out y reversiones.</p>
            </div>
          </div>
          <div className="customer-payment-history">
            {staysWithPayments.map((stay) => (
              <details key={stay.stayId} className="customer-payment-group" open>
                <summary>
                  <span>Estancia #{stay.stayId} · {stay.reservationCode}</span>
                  <strong>{stay.payments.length} pago(s) · {money(stay.paid)}</strong>
                </summary>
                <div className="feature-panel">
                  <table className="feature-table">
                    <thead>
                      <tr>
                        <th>Comprobante</th>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stay.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <strong>{payment.paymentNumber}</strong>
                            {payment.invoiceId && <small>Factura #{payment.invoiceId}</small>}
                          </td>
                          <td>{new Date(payment.paymentDate).toLocaleString("es-NI")}</td>
                          <td>{payment.paymentMethod}<small>{payment.reference || payment.receivedByName}</small></td>
                          <td className={payment.kind === "REVERSAL" ? "negative" : "positive"}>
                            {payment.kind === "REVERSAL" ? "−" : "+"}{money(payment.amount)}
                          </td>
                          <td>{payment.status === "REVERSED" ? "Revertido" : "Registrado"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  );
}
