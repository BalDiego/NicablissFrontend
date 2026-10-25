import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { legacyAdministrationService } from "../../services/legacyAdministration.service";
import type { HistoricalAccount, HistoricalAccountSummary, LegacyReview } from "../../services/types";
import "../features.css";
import "./legacy-administration.css";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

function sourceSummary(review: LegacyReview): string {
  const source = review.sourceData;
  if (!source) return "Registro fuente no disponible";
  const name = source.nombre || source.huesped || source.order_code || `ID ${review.sourceId}`;
  const room = source.habitacion ? ` · ${source.habitacion}` : "";
  const date = source.fecha || source.entrada;
  return `${String(name)}${room}${date ? ` · ${String(date)}` : ""}`;
}

export default function LegacyAdministrationPage() {
  const [tab, setTab] = useState<"accounts" | "reviews">("accounts");
  const [accounts, setAccounts] = useState<HistoricalAccount[]>([]);
  const [accountSummary, setAccountSummary] = useState<HistoricalAccountSummary | null>(null);
  const [reviews, setReviews] = useState<LegacyReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ pending: 0, acceptedUnlinked: 0 });
  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [selected, setSelected] = useState<LegacyReview | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = useCallback(async () => {
    const data = await legacyAdministrationService.getHistoricalAccounts(search, openOnly);
    setAccounts(data.accounts);
    setAccountSummary(data.summary);
  }, [openOnly, search]);

  const loadReviews = useCallback(async () => {
    const data = await legacyAdministrationService.getReviews(includeResolved);
    setReviews(data.reviews);
    setReviewSummary(data.summary);
  }, [includeResolved]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAccounts(), loadReviews()]);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar la administración heredada");
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadReviews]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const accept = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || reason.trim().length < 10) return;
    setSubmitting(true);
    try {
      await legacyAdministrationService.acceptUnlinked(selected.id, reason.trim());
      setSelected(null);
      setReason("");
      await loadReviews();
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo resolver el registro");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="feature-page legacy-admin-page">
      <header className="feature-heading">
        <div>
          <span>ADMINISTRACIÓN / LEGADO</span>
          <h1>Conciliación de datos heredados</h1>
          <p>Consulta saldos preservados y documenta revisiones sin crear asociaciones ni pagos ficticios.</p>
        </div>
        <button className="feature-primary" onClick={() => void load()} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error && <div className="feature-error"><span>{error}</span><button onClick={() => void load()}>Reintentar</button></div>}

      <section className="legacy-kpis">
        <article><span>Saldo histórico</span><strong>{money(accountSummary?.balance ?? 0)}</strong><small>{accountSummary?.openCount ?? 0} cuentas abiertas</small></article>
        <article><span>Total preservado</span><strong>{money(accountSummary?.total ?? 0)}</strong><small>{accountSummary?.accountCount ?? 0} cuentas</small></article>
        <article><span>Revisiones pendientes</span><strong>{reviewSummary.pending}</strong><small>Requieren decisión administrativa</small></article>
        <article><span>Aceptadas sin vínculo</span><strong>{reviewSummary.acceptedUnlinked}</strong><small>Con justificación y auditoría</small></article>
      </section>

      <div className="legacy-tabs" role="tablist" aria-label="Datos heredados">
        <button className={tab === "accounts" ? "active" : ""} onClick={() => setTab("accounts")}>Cuentas históricas</button>
        <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Revisiones ({reviewSummary.pending})</button>
      </div>

      {tab === "accounts" ? <>
        <section className="feature-toolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar huésped, habitación, concepto o ID" aria-label="Buscar cuentas históricas" />
          <label className="feature-checkbox"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /> Solo saldos abiertos</label>
        </section>
        <section className="feature-panel">
          <table className="feature-table"><thead><tr><th>Origen</th><th>Huésped</th><th>Concepto</th><th>Fecha</th><th>Total</th><th>Abonado</th><th>Saldo</th><th>Vínculos</th></tr></thead>
            <tbody>{accounts.map((account) => <tr key={account.id}>
              <td>{account.sourceTable}<small>#{account.sourceId}</small></td>
              <td><strong>{account.guestName}</strong><small>{account.roomName}</small></td>
              <td>{account.concept}<small>{account.legacyStatus}</small></td>
              <td>{account.legacyDate}{account.paymentDateBasis === "MIGRATION_DATE" && <small>Fecha de pago: migración</small>}</td>
              <td>{money(account.total)}</td><td>{money(account.paid)}</td>
              <td className={account.balance > 0 ? "negative" : "positive"}>{money(account.balance)}</td>
              <td><small>Cliente: {account.customerId ?? "—"}</small><small>Reserva: {account.reservationId ?? "—"} · Estancia: {account.stayId ?? "—"}</small></td>
            </tr>)}</tbody>
          </table>
          {!loading && accounts.length === 0 && <p className="feature-state">No hay cuentas históricas para estos filtros.</p>}
        </section>
      </> : <>
        <section className="feature-toolbar">
          <p className="legacy-guidance">Aceptar sin vínculo conserva el registro fuente, cierra la revisión y deja evidencia de quién tomó la decisión.</p>
          <label className="feature-checkbox"><input type="checkbox" checked={includeResolved} onChange={(event) => setIncludeResolved(event.target.checked)} /> Mostrar resueltas</label>
        </section>
        <section className="feature-panel">
          <table className="feature-table"><thead><tr><th>Fuente</th><th>Registro</th><th>Destino esperado</th><th>Motivo técnico</th><th>Estado</th><th /></tr></thead>
            <tbody>{reviews.map((review) => <tr key={review.id}>
              <td>{review.sourceTable}<small>#{review.sourceId}</small></td>
              <td>{sourceSummary(review)}</td>
              <td>{review.targetTable?.replaceAll(",", ", ") || "Sin destino"}</td>
              <td className="legacy-notes">{review.notes || "Sin detalle"}</td>
              <td><span className="feature-badge">{review.status === "REVIEW" ? "Pendiente" : "Aceptado sin vínculo"}</span>{review.resolvedAt && <small>{new Date(review.resolvedAt).toLocaleString("es-NI")}</small>}</td>
              <td>{review.status === "REVIEW" && <button className="feature-link" onClick={() => { setSelected(review); setReason(""); }}>Revisar</button>}</td>
            </tr>)}</tbody>
          </table>
          {!loading && reviews.length === 0 && <p className="feature-state">No hay revisiones pendientes.</p>}
        </section>
      </>}

      {selected && <div className="feature-overlay" role="presentation">
        <section className="feature-modal" role="dialog" aria-modal="true" aria-labelledby="legacy-resolution-title">
          <header><h2 id="legacy-resolution-title">Aceptar registro sin vínculo</h2><button onClick={() => setSelected(null)} aria-label="Cerrar">×</button></header>
          <form className="feature-form" onSubmit={(event) => void accept(event)}>
            <p><strong>{selected.sourceTable} #{selected.sourceId}</strong><br />{sourceSummary(selected)}</p>
            <div className="legacy-warning">Esta acción no crea clientes, estancias, consumos ni movimientos contables. Solo documenta que el legado fue revisado y se conservará sin asociación.</div>
            <label>Justificación administrativa<textarea rows={4} required minLength={10} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explique por qué no es posible vincular el registro con certeza..." /></label>
            <footer><button type="button" onClick={() => setSelected(null)}>Cancelar</button><button className="feature-primary" disabled={submitting || reason.trim().length < 10}>{submitting ? "Guardando..." : "Aceptar sin vínculo"}</button></footer>
          </form>
        </section>
      </div>}
    </main>
  );
}
