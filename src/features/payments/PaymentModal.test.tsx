import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackContext } from "../../contexts/feedback-context";
import type { Reservation } from "../../services/types";
import PaymentModal from "./PaymentModal";

const { createPayment } = vi.hoisted(() => ({ createPayment: vi.fn() }));

vi.mock("../../services/reservation.service", () => ({
  reservationService: { createPayment },
}));

const reservation: Reservation = {
  id: 41,
  codigoReserva: "RES-2026-000041",
  customerId: 7,
  customerName: "Cliente de prueba",
  customerDocument: "DOC-41",
  roomId: 2,
  habitacion: "Habitación 02",
  fechaEntrada: "2026-11-10",
  fechaSalida: "2026-11-12",
  totalReserva: 200,
  depositType: "PERCENTAGE",
  depositValue: 50,
  depositoRequerido: 100,
  abonado: 100,
  saldo: 100,
  estado: "Confirmada",
  createdBy: "usr_admin_001",
  createdAt: "2026-10-24T00:00:00.000Z",
  updatedAt: "2026-10-24T00:00:00.000Z",
};

function renderModal(maxAmount?: number) {
  const notify = vi.fn();
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <FeedbackContext.Provider value={{ notify, confirm: vi.fn() }}>
      <PaymentModal reservation={reservation} maxAmount={maxAmount} onClose={onClose} onSaved={onSaved} />
    </FeedbackContext.Provider>
  );
  return { notify, onClose, onSaved };
}

describe("PaymentModal", () => {
  beforeEach(() => {
    createPayment.mockReset();
  });

  afterEach(() => cleanup());

  it("muestra carga y evita el doble envío mientras el pago sigue pendiente", async () => {
    let resolvePayment: (() => void) | undefined;
    createPayment.mockImplementation(() => new Promise<void>((resolve) => { resolvePayment = resolve; }));
    const user = userEvent.setup();
    const { onSaved } = renderModal();
    const submit = screen.getByRole("button", { name: "Confirmar pago" });

    await user.click(submit);
    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Procesando..." }));
    expect(createPayment).toHaveBeenCalledTimes(1);

    resolvePayment?.();
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("conserva el formulario y presenta el error claro devuelto por la API", async () => {
    createPayment.mockRejectedValue(new Error("Debe existir una caja abierta"));
    const user = userEvent.setup();
    const { notify, onSaved } = renderModal();

    await user.click(screen.getByRole("button", { name: "Confirmar pago" }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Debe existir una caja abierta", "error"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar pago" })).toBeEnabled();
    expect(screen.getByLabelText("Monto (USD) *")).toHaveValue(100);
  });

  it("usa el saldo completo de la cuenta cuando la reserva ya está finalizada", () => {
    renderModal(175);
    expect(screen.getByText("Saldo: $175.00")).toBeInTheDocument();
    expect(screen.getByLabelText("Monto (USD) *")).toHaveValue(175);
    expect(screen.getByLabelText("Monto (USD) *")).toHaveAttribute("max", "175");
  });
});
