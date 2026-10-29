import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CashReconciliation, CashSession } from "../../services/types";
import CashClosureDetail from "./CashClosureDetail";

const { getReconciliation } = vi.hoisted(() => ({ getReconciliation: vi.fn() }));

vi.mock("../../services/cash.service", () => ({
  cashService: { getReconciliation },
}));

const session: CashSession = {
  id: 42,
  responsable: "Alejandra",
  openedBy: "user-opened",
  openedByName: "Alejandra",
  closedBy: "user-closed",
  closedByName: "Supervisora",
  apertura: "29/10/2026, 08:00",
  cierre: "29/10/2026, 18:00",
  fondoInicial: 100,
  ingresosEfectivo: 40,
  ingresosDigitales: 0,
  salidasEfectivo: 2,
  efectivoEsperado: 138,
  efectivoContado: 138,
  diferencia: 0,
  observaciones: "Cierre revisado por supervisión",
  isClosed: true,
  movimientos: [
    {
      id: 301,
      fecha: "29/10/2026, 12:15",
      tipo: "Ingreso",
      concepto: "Hospedaje",
      descripcion: "Pago de reserva",
      metodo: "Efectivo",
      monto: 40,
      paymentId: 501,
      createdBy: "user-opened",
      createdByName: "Alejandra",
      source: "PAYMENT",
    },
    {
      id: 302,
      fecha: "29/10/2026, 15:30",
      tipo: "Salida",
      concepto: "Gasto operativo",
      descripcion: "Compra de suministros",
      metodo: "Efectivo",
      monto: 2,
      createdByName: "Alejandra",
      source: "MANUAL",
    },
  ],
};

const reconciliation: CashReconciliation = {
  session: {
    id: 42,
    responsable: "Alejandra",
    apertura: session.apertura,
    cierre: session.cierre,
    isClosed: true,
    fondoInicial: 100,
  },
  filters: {},
  totals: {
    paymentCount: 1,
    payments: 40,
    reversals: 0,
    netPayments: 40,
    automaticMovementCount: 1,
    movementIncome: 40,
    movementReversals: 0,
    netMovements: 40,
    difference: 0,
    manualIncome: 0,
    manualOutput: 2,
  },
  sessionIntegrity: {
    storedCashIncome: 40,
    computedCashIncome: 40,
    cashIncomeDifference: 0,
    storedDigitalIncome: 0,
    computedDigitalIncome: 0,
    digitalIncomeDifference: 0,
    storedCashOutput: 2,
    computedCashOutput: 2,
    cashOutputDifference: 0,
    storedExpectedCash: 138,
    computedExpectedCash: 138,
    expectedCashDifference: 0,
    balanced: true,
  },
  mismatchCount: 0,
  missingMovementCount: 0,
  orphanMovementCount: 0,
  balanced: true,
  items: [
    {
      paymentId: 501,
      paymentNumber: "PAY-2026-000042",
      kind: "PAYMENT",
      status: "POSTED",
      method: "Efectivo",
      paymentDate: "2026-10-29T18:15:00.000Z",
      userId: "user-opened",
      userName: "Alejandra",
      expectedAmount: 40,
      movementId: 301,
      movementAmount: 40,
      difference: 0,
      issues: [],
    },
  ],
  orphanMovements: [],
};

describe("CashClosureDetail", () => {
  beforeEach(() => getReconciliation.mockReset());
  afterEach(() => cleanup());

  it("muestra arqueo, responsables, movimientos y conciliación del cierre seleccionado", async () => {
    getReconciliation.mockResolvedValue(reconciliation);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<CashClosureDetail session={session} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Detalle del cierre" })).toBeInTheDocument();
    expect(screen.getByText("Supervisora")).toBeInTheDocument();
    expect(screen.getByText("Cierre revisado por supervisión")).toBeInTheDocument();
    expect(screen.getByText("Efectivo contado")).toBeInTheDocument();
    expect(screen.getByText("Caja cuadrada")).toBeInTheDocument();
    expect(screen.getByText("Compra de suministros")).toBeInTheDocument();
    expect(screen.getByText("Pago automático")).toBeInTheDocument();

    expect(await screen.findByText("Pagos y movimientos automáticos coinciden.")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getAllByText("PAY-2026-000042")).toHaveLength(2);
    expect(getReconciliation).toHaveBeenCalledWith(42);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("permite reintentar la conciliación y señala incidencias sin ocultar el libro", async () => {
    const unbalanced: CashReconciliation = {
      ...reconciliation,
      balanced: false,
      mismatchCount: 1,
      missingMovementCount: 1,
      items: [{ ...reconciliation.items[0], movementId: undefined, movementAmount: 0, difference: 40, issues: ["MISSING_MOVEMENT"] }],
    };
    getReconciliation.mockRejectedValueOnce(new Error("Servicio temporalmente no disponible"));
    getReconciliation.mockResolvedValueOnce(unbalanced);
    const user = userEvent.setup();

    render(<CashClosureDetail session={session} onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio temporalmente no disponible");
    expect(screen.getByText("Compra de suministros")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar conciliación" }));

    expect(await screen.findByText("Este cierre requiere revisión.")).toBeInTheDocument();
    expect(screen.getByText("Falta el movimiento en Caja")).toBeInTheDocument();
    await waitFor(() => expect(getReconciliation).toHaveBeenCalledTimes(2));
  });
});
