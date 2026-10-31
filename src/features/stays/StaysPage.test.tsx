import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { FeedbackContext } from "../../contexts/feedback-context";
import { reservationService } from "../../services/reservation.service";
import { stayService } from "../../services/stay.service";
import type { Reservation, Stay } from "../../services/types";
import StaysPage from "./StaysPage";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "RECEPTIONIST" } }),
}));

vi.mock("../../services/reservation.service", () => ({
  reservationService: {
    getAll: vi.fn(),
    checkIn: vi.fn(),
  },
}));

vi.mock("../../services/stay.service", () => ({
  stayService: { getAll: vi.fn() },
}));

const confirmedReservation = {
  id: 12,
  codigoReserva: "RES-2037-000012",
  customerName: "María González",
  customerDocument: "DOC-12",
  habitacion: "Habitación 02",
  fechaEntrada: "2037-01-08",
  estado: "Confirmada",
} as Reservation;

const pendingReservation = {
  ...confirmedReservation,
  id: 13,
  codigoReserva: "RES-2037-000013",
  customerName: "Reserva Pendiente",
  estado: "Pendiente",
} as Reservation;

const createdStay = {
  id: 88,
  estado: "Activa",
} as Stay;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe("StaysPage arrival flow", () => {
  const notify = vi.fn();
  const confirm = vi.fn();

  beforeEach(() => {
    vi.mocked(stayService.getAll).mockResolvedValue([]);
    vi.mocked(reservationService.getAll).mockResolvedValue([confirmedReservation, pendingReservation]);
    vi.mocked(reservationService.checkIn).mockResolvedValue(createdStay);
    notify.mockReset();
    confirm.mockReset().mockResolvedValue(true);
  });

  afterEach(() => cleanup());

  it("checks in a confirmed reservation and opens its service registration", async () => {
    render(
      <MemoryRouter initialEntries={["/stays"]}>
        <LocationProbe />
        <FeedbackContext.Provider value={{ notify, confirm }}>
          <StaysPage />
        </FeedbackContext.Provider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Registrar llegada" }));

    expect(await screen.findByText("María González")).toBeInTheDocument();
    expect(screen.queryByText("Reserva Pendiente")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Registrar check-in" }));

    await waitFor(() => expect(reservationService.checkIn).toHaveBeenCalledWith(12));
    expect(confirm).toHaveBeenCalledWith("¿Registrar la llegada de María González a Habitación 02?");
    expect(await screen.findByTestId("current-path")).toHaveTextContent("/stays/88/services");
    expect(notify).toHaveBeenCalledWith("Llegada registrada. Ya puedes agregar servicios.");
  });

  it("opens the quick-arrival reservation flow", () => {
    render(
      <MemoryRouter initialEntries={["/stays"]}>
        <LocationProbe />
        <FeedbackContext.Provider value={{ notify, confirm }}>
          <StaysPage />
        </FeedbackContext.Provider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Llegada sin reserva" }));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/reservations/new");
  });
});
