import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FeedbackContext } from "../../contexts/feedback-context";
import { reservationService } from "../../services/reservation.service";
import { customerService } from "../../services/customer.service";
import type { Reservation } from "../../services/types";
import ReservationForm from "./ReservationForm";

vi.mock("../../services/reservation.service", () => ({
  reservationService: {
    create: vi.fn(),
    createPayment: vi.fn(),
    getRooms: vi.fn(),
  },
}));

vi.mock("../../services/customer.service", () => ({
  customerService: { getAll: vi.fn() },
}));

const availableRoom = {
  id: 9,
  code: "TEST-09",
  name: "Habitación de prueba",
  category: "Suite",
  description: "",
  pricePerNight: 50,
  active: true,
  available: true,
};

const createdReservation: Reservation = {
  id: 123,
  codigoReserva: "RES-2037-000123",
  customerId: 5,
  customerName: "Huésped de prueba",
  customerDocument: "DOC-RESERVATION-409",
  roomId: 9,
  habitacion: "Habitación de prueba",
  roomCategory: "Suite",
  fechaEntrada: "2037-01-10",
  fechaSalida: "2037-01-12",
  nights: 2,
  roomPricePerNight: 50,
  lodgingTotal: 100,
  totalReserva: 100,
  depositType: "PERCENTAGE",
  depositValue: 50,
  depositoRequerido: 50,
  abonado: 0,
  saldo: 100,
  estado: "Pendiente",
  createdBy: "test-user",
  createdAt: "2037-01-01T00:00:00.000Z",
  updatedAt: "2037-01-01T00:00:00.000Z",
};

describe("ReservationForm", () => {
  const notify = vi.fn();

  beforeEach(() => {
    vi.mocked(customerService.getAll).mockResolvedValue([]);
    vi.mocked(reservationService.getRooms).mockResolvedValue([availableRoom]);
    vi.mocked(reservationService.create).mockReset();
    vi.mocked(reservationService.createPayment).mockReset();
    notify.mockReset();
  });

  afterEach(() => cleanup());

  function renderForm() {
    return render(
      <MemoryRouter>
        <FeedbackContext.Provider value={{ notify, confirm: vi.fn().mockResolvedValue(true) }}>
          <ReservationForm />
        </FeedbackContext.Provider>
      </MemoryRouter>
    );
  }

  async function fillNewCustomerReservation(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Registrar nuevo cliente" }));
    await user.type(screen.getByLabelText("Nombre del huésped *"), "Huésped de prueba");
    await user.type(screen.getByLabelText("Documento *"), "DOC-RESERVATION-409");
    fireEvent.change(screen.getByLabelText("Entrada *"), { target: { value: "2037-01-10" } });
    fireEvent.change(screen.getByLabelText("Salida *"), { target: { value: "2037-01-12" } });

    const roomSelect = screen.getByLabelText("Habitación disponible *");
    await waitFor(() => expect(roomSelect.querySelectorAll("option")).toHaveLength(2));
    await user.selectOptions(roomSelect, "9");
    await waitFor(() => expect(screen.getByLabelText("Total de hospedaje calculado (USD) *")).toHaveValue(100));
  }

  it("preserves the entered reservation and shows a conflict returned by the API", async () => {
    const conflict = Object.assign(new Error("La habitación ya está reservada en ese rango"), {
      code: "ROOM_UNAVAILABLE",
      status: 409,
    });
    vi.mocked(reservationService.create).mockRejectedValue(conflict);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      "La habitación ya está reservada en ese rango",
      "error"
    ));
    expect(screen.getByLabelText("Documento *")).toHaveValue("DOC-RESERVATION-409");
    expect(screen.getByRole("button", { name: "Crear reserva" })).toBeEnabled();
    expect(reservationService.createPayment).not.toHaveBeenCalled();
  });

  it("creates the reservation with a calculated total and leaves payment optional", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    expect(screen.getByLabelText("Total de hospedaje calculado (USD) *")).toHaveAttribute("readonly");
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(reservationService.create).toHaveBeenCalledOnce());
    const payload = vi.mocked(reservationService.create).mock.calls[0][0];
    expect(payload.totalReserva).toBeUndefined();
    expect(payload.customer?.documento).toBe("DOC-RESERVATION-409");
    expect(payload.roomId).toBe(9);
    expect(reservationService.createPayment).not.toHaveBeenCalled();
  });

  it("records an optional advance, its method/reference and displays the remaining balance", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    vi.mocked(reservationService.createPayment).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    await user.click(screen.getByLabelText("Registrar pago ahora (opcional)"));
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (USD) *")).toHaveValue(50));
    expect(screen.getByText(/Saldo pendiente después del pago:/)).toHaveTextContent("$50.00");

    await user.selectOptions(screen.getByLabelText("Método de pago *"), "Transferencia");
    await user.type(screen.getByLabelText("Referencia *"), "TRX-2037-001");
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(reservationService.createPayment).toHaveBeenCalledOnce());
    const [reservationId, payment, idempotencyKey] = vi.mocked(reservationService.createPayment).mock.calls[0];
    expect(reservationId).toBe(createdReservation.id);
    expect(payment).toEqual({ amount: 50, paymentMethod: "Transferencia", reference: "TRX-2037-001" });
    expect(idempotencyKey).toEqual(expect.any(String));
  });

  it("does not retry reservation creation when the optional payment fails", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    vi.mocked(reservationService.createPayment).mockRejectedValue(new Error("No hay una caja abierta"));
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    await user.click(screen.getByLabelText("Registrar pago ahora (opcional)"));
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (USD) *")).toHaveValue(50));
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      "La reserva RES-2037-000123 se creó, pero el pago no se registró: No hay una caja abierta",
      "error"
    ));
    expect(reservationService.create).toHaveBeenCalledOnce();
    expect(reservationService.createPayment).toHaveBeenCalledOnce();
  });
});
