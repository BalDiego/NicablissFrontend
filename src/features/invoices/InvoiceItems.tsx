import type { InvoiceItem } from "../../services/types";

export default function InvoiceItems({ items }: { items: InvoiceItem[] }) {
  return (
    <div className="feature-panel">
      <table className="feature-table">
        <thead><tr><th>Concepto</th><th>Tipo</th><th>Cantidad</th><th>Precio unitario</th><th>Impuesto</th><th>Total</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.description}</strong></td><td>{item.serviceType === "LODGING" ? "Hospedaje" : "Servicio"}</td><td>{item.quantity}</td><td>${item.unitPrice.toFixed(2)}</td><td>${item.tax.toFixed(2)}</td><td><strong>${item.total.toFixed(2)}</strong></td></tr>)}</tbody>
      </table>
      {items.length === 0 && <p className="feature-state">La factura no contiene líneas.</p>}
    </div>
  );
}
