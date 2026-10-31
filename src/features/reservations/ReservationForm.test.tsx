import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FeedbackContext } from "../../contexts/feedback-context";
import { reservationService } from "../../services/reservation.service";
import { customerService } from "../../services/customer.service";
import ReservationForm from "./ReservationForm";

vi.mock("../../services/reservation.service", () => ({
  reservationService: {
    create: vi.fn(),
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

describe("ReservationForm API errors", () => {
  beforeEach(() => {
    vi.mocked(customerService.getAll).mockResolvedValue([]);
    vi.mocked(reservationService.getRooms).mockResolvedValue([availableRoom]);
    vi.mocked(reservationService.create).mockReset();
  });

  afterEach(() => cleanup());

  it("preserves the entered reservation and shows a conflict returned by the API", async () => {
    const conflict = Object.assign(new Error("La habitación ya está reservada en ese rango"), {
      code: "ROOM_UNAVAILABLE",
      status: 409,
    });
    vi.mocked(reservationService.create).mockRejectedValue(conflict);
    const notify = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FeedbackContext.Provider value={{ notify, confirm: vi.fn().mockResolvedValue(true) }}>
          <ReservationForm />
        </FeedbackContext.Provider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Registrar nuevo cliente" }));
    await user.type(screen.getByLabelText("Nombre del huésped *"), "Huésped de prueba");
    await user.type(screen.getByLabelText("Documento *"), "DOC-RESERVATION-409");
    fireEvent.change(screen.getByLabelText("Entrada *"), { target: { value: "2037-01-10" } });
    fireEvent.change(screen.getByLabelText("Salida *"), { target: { value: "2037-01-12" } });

    const roomSelect = screen.getByLabelText("Habitación disponible *");
    await waitFor(() => expect(roomSelect.querySelectorAll("option")).toHaveLength(2));
    await user.selectOptions(roomSelect, "9");
    await waitFor(() => expect(screen.getByLabelText("Total de reserva (USD) *")).toHaveValue(100));
    await user.click(screen.getByRole("button", { name: "Crear reserva" }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith(
      "La habitación ya está reservada en ese rango",
      "error"
    ));
    expect(screen.getByLabelText("Documento *")).toHaveValue("DOC-RESERVATION-409");
    expect(screen.getByRole("button", { name: "Crear reserva" })).toBeEnabled();
  });
});
