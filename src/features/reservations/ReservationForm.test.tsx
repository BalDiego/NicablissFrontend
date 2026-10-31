import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { FeedbackContext } from "../../contexts/feedback-context";
import { reservationService } from "../../services/reservation.service";
import { customerService } from "../../services/customer.service";
import type { Reservation } from "../../services/types";
import ReservationForm from "./ReservationForm";

vi.mock("../../services/reservation.service", () => ({
  reservationService: {
    create: vi.fn(),
    createPayment: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    checkIn: vi.fn(),
    getRooms: vi.fn(),
  },
}));

vi.mock("../../services/customer.service", () => ({
  customerService: { getAll: vi.fn() },
}));

vi.mock("../../hooks/useBusinessToday", () => ({
  useBusinessToday: () => "2037-01-08",
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

const occupiedRoom = {
  ...availableRoom,
  id: 8,
  code: "TEST-08",
  name: "Habitación ocupada",
  available: false,
  availableFrom: "2037-01-12",
};

const inactiveRoom = {
  ...availableRoom,
  id: 7,
  code: "TEST-07",
  name: "Habitación inactiva",
  active: false,
  available: false,
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
    localStorage.removeItem("nicabliss_reservation_draft");
    vi.mocked(customerService.getAll).mockResolvedValue([]);
    vi.mocked(reservationService.getRooms).mockResolvedValue([availableRoom]);
    vi.mocked(reservationService.create).mockReset();
    vi.mocked(reservationService.createPayment).mockReset();
    vi.mocked(reservationService.getById).mockReset();
    vi.mocked(reservationService.updateStatus).mockReset();
    vi.mocked(reservationService.checkIn).mockReset();
    notify.mockReset();
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem("nicabliss_reservation_draft");
  });

  function renderForm() {
    return renderFormAt("/reservations/new");
  }

  function CurrentPath() {
    const location = useLocation();
    return <output data-testid="current-path">{location.pathname}</output>;
  }

  function renderFormAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <CurrentPath />
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
    await waitFor(() => {
      expect(roomSelect).toHaveTextContent(availableRoom.name);
      expect(roomSelect).toBeEnabled();
    });
    await user.selectOptions(roomSelect, "9");
    await waitFor(() => expect(screen.getByLabelText("Total de hospedaje calculado (USD)")).toHaveTextContent("$100.00"));
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
    expect(screen.getByLabelText("Total de hospedaje calculado (USD)")).toHaveTextContent("$100.00");
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(reservationService.create).toHaveBeenCalledOnce());
    const payload = vi.mocked(reservationService.create).mock.calls[0][0];
    expect(payload.totalReserva).toBeUndefined();
    expect(payload.customer?.documento).toBe("DOC-RESERVATION-409");
    expect(payload.roomId).toBe(9);
    expect(localStorage.getItem("nicabliss_reservation_draft")).toBeNull();
    expect(reservationService.createPayment).not.toHaveBeenCalled();
  });

  it("defaults the check-in date to the configured business date", () => {
    renderForm();

    expect(screen.getByLabelText("Entrada *")).toHaveValue("2037-01-08");
    expect(screen.getByText("Fecha: 08/01/2037 (DD/MM/AAAA)")).toBeInTheDocument();
  });

  it("loads and displays rooms before the guest enters both dates", async () => {
    renderForm();

    const roomSelect = screen.getByLabelText("Habitación disponible *");
    await waitFor(() => expect(roomSelect).toBeEnabled());

    expect(roomSelect).toHaveTextContent("Habitación de prueba");
    expect(reservationService.getRooms).toHaveBeenCalledWith(undefined, undefined);
    expect(screen.getByText("Las habitaciones ya están cargadas. Selecciona fechas para confirmar disponibilidad.")).toBeInTheDocument();
  });

  it("shows occupied and inactive rooms with their status and availability date", async () => {
    vi.mocked(reservationService.getRooms).mockResolvedValue([availableRoom, occupiedRoom, inactiveRoom]);
    renderForm();

    const roomSelect = screen.getByLabelText("Habitación disponible *");
    await waitFor(() => expect(roomSelect).toBeEnabled());

    const occupiedOption = screen.getByRole("option", { name: /Habitación ocupada.*Ocupada.*Disponible desde 12\/01\/2037/ });
    const inactiveOption = screen.getByRole("option", { name: /Habitación inactiva.*Inactiva/ });
    expect(occupiedOption).toBeInTheDocument();
    expect(occupiedOption).toBeEnabled();
    expect(inactiveOption).toBeDisabled();
  });

  it("disables occupied rooms for the selected date range and shows when they free up", async () => {
    vi.mocked(reservationService.getRooms).mockResolvedValue([availableRoom, occupiedRoom, inactiveRoom]);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);

    expect(screen.getByRole("option", { name: /Habitación ocupada.*Ocupada.*Disponible desde 12\/01\/2037/ })).toBeDisabled();
    expect(screen.getByRole("option", { name: /Habitación inactiva.*Inactiva/ })).toBeDisabled();
  });

  it("leaves the fixed advance empty until an amount is entered", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    await user.selectOptions(screen.getByLabelText("Tipo de anticipo"), "FIXED");
    const depositInput = screen.getByLabelText(/Monto de anticipo/);
    expect(depositInput).toHaveValue(null);

    await user.type(depositInput, "25.50");
    expect(depositInput).toHaveValue(25.5);
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(reservationService.create).toHaveBeenCalledOnce());
    expect(vi.mocked(reservationService.create).mock.calls[0][0]).toMatchObject({
      depositType: "FIXED",
      depositValue: 25.5,
    });
  });

  it("restores the reservation draft after leaving and returning to the form", async () => {
    const user = userEvent.setup();
    const firstRender = renderForm();

    await fillNewCustomerReservation(user);
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("nicabliss_reservation_draft") || "{}") as { form?: { roomId?: number } };
      expect(saved.form?.roomId).toBe(9);
    });

    firstRender.unmount();
    renderForm();

    expect(screen.getByRole("button", { name: "Registrar nuevo cliente" })).toHaveClass("feature-primary");
    expect(screen.getByLabelText("Nombre del huésped *")).toHaveValue("Huésped de prueba");
    expect(screen.getByLabelText("Documento *")).toHaveValue("DOC-RESERVATION-409");
    expect(screen.getByLabelText("Entrada *")).toHaveValue("2037-01-10");
    expect(screen.getByLabelText("Salida *")).toHaveValue("2037-01-12");
    expect(screen.getByLabelText("Total de hospedaje calculado (USD)")).toHaveTextContent("$100.00");
  });

  it("records an optional advance, its method/reference and displays the remaining balance", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    vi.mocked(reservationService.createPayment).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderForm();

    await fillNewCustomerReservation(user);
    await user.click(screen.getByLabelText("Registrar pago ahora (opcional)"));
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (USD) *")).toHaveValue(50));
    expect(screen.getByLabelText("Resumen de la reserva")).toHaveTextContent(/Saldo pendiente\s*\$50\.00/);

    await user.selectOptions(screen.getByLabelText("Método de pago *"), "Transferencia");
    await user.type(screen.getByLabelText("Referencia *"), "TRX-2037-001");
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(reservationService.createPayment).toHaveBeenCalledOnce());
    const [reservationId, payment, idempotencyKey] = vi.mocked(reservationService.createPayment).mock.calls[0];
    expect(reservationId).toBe(createdReservation.id);
    expect(payment).toEqual({ amount: 50, paymentMethod: "Transferencia", reference: "TRX-2037-001" });
    expect(idempotencyKey).toEqual(expect.any(String));
  });

  it("confirms and checks in a quick-arrival reservation when the required advance is paid", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    vi.mocked(reservationService.createPayment).mockResolvedValue({} as never);
    vi.mocked(reservationService.getById).mockResolvedValue({ ...createdReservation, abonado: 50 });
    vi.mocked(reservationService.updateStatus).mockResolvedValue({ ...createdReservation, abonado: 50, estado: "Confirmada" });
    vi.mocked(reservationService.checkIn).mockResolvedValue({ id: 88 } as never);
    const user = userEvent.setup();
    renderFormAt("/reservations/new?checkInNow=1");

    expect(screen.getByRole("heading", { name: "Llegada sin reserva" })).toBeInTheDocument();
    await fillNewCustomerReservation(user);
    await user.click(screen.getByLabelText("Registrar pago ahora (opcional)"));
    await waitFor(() => expect(screen.getByLabelText("Monto recibido (USD) *")).toHaveValue(50));
    await user.click(screen.getByRole("button", { name: "Crear reserva y registrar llegada" }));

    await waitFor(() => expect(reservationService.checkIn).toHaveBeenCalledWith(createdReservation.id));
    expect(reservationService.updateStatus).toHaveBeenCalledWith(createdReservation.id, "Confirmada");
    expect(screen.getByTestId("current-path")).toHaveTextContent("/stays/88/services");
    expect(notify).toHaveBeenCalledWith("Llegada registrada. Ya puedes agregar servicios.");
  });

  it("leaves the quick-arrival reservation on its detail when the advance is not covered", async () => {
    vi.mocked(reservationService.create).mockResolvedValue(createdReservation);
    vi.mocked(reservationService.getById).mockResolvedValue(createdReservation);
    const user = userEvent.setup();
    renderFormAt("/reservations/new?checkInNow=1");

    await fillNewCustomerReservation(user);
    await user.click(screen.getByRole("button", { name: "Crear reserva y registrar llegada" }));

    await waitFor(() => expect(reservationService.getById).toHaveBeenCalledWith(createdReservation.id));
    expect(reservationService.updateStatus).not.toHaveBeenCalled();
    expect(reservationService.checkIn).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-path")).toHaveTextContent(`/reservations/${createdReservation.id}`);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("Registra el anticipo requerido y confirma la reserva"));
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
