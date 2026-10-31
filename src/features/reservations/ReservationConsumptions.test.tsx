import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackContext } from "../../contexts/feedback-context";
import { reservationService } from "../../services/reservation.service";
import type { ReservationAccount, ServiceCatalog } from "../../services/types";
import ReservationConsumptions from "./ReservationConsumptions";

vi.mock("../../services/reservation.service", () => ({
  reservationService: { addConsumption: vi.fn() },
}));

vi.mock("../../services/service.service", () => ({
  serviceService: { updateStatus: vi.fn(), updateConsumption: vi.fn() },
}));

const account: ReservationAccount = {
  reservationId: 12,
  reservationCode: "RES-2026-000012",
  reservationStatus: "CheckIn",
  customerId: 5,
  customerName: "Huésped de prueba",
  customerDocument: "DOC-12",
  roomId: 3,
  habitacion: "Habitación 03",
  fechaEntrada: "2037-01-10",
  fechaSalida: "2037-01-12",
  nights: 2,
  roomPricePerNight: 50,
  stayId: 8,
  checkInAt: "2037-01-10T15:00:00.000Z",
  status: "Activa",
  lodging: 100,
  services: 0,
  pendingServicesAmount: 0,
  total: 100,
  paid: 0,
  balance: 100,
  billableServiceCount: 0,
  pendingServiceCount: 0,
  consumptions: [],
  payments: [],
};

const catalog: ServiceCatalog[] = [{
  id: 17,
  nombre: "Servicio de prueba",
  categoria: "Otro",
  precio: 12,
  impuesto: 0,
  activo: true,
  createdAt: "2037-01-01T00:00:00.000Z",
  updatedAt: "2037-01-01T00:00:00.000Z",
}];

describe("ReservationConsumptions API errors", () => {
  beforeEach(() => vi.mocked(reservationService.addConsumption).mockReset());
  afterEach(() => cleanup());

  it("keeps the form available and reports an API validation/conflict error", async () => {
    vi.mocked(reservationService.addConsumption).mockRejectedValueOnce(
      new Error("La cuenta tiene una factura emitida")
    );
    const notify = vi.fn();
    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <FeedbackContext.Provider value={{ notify, confirm: vi.fn().mockResolvedValue(true) }}>
        <ReservationConsumptions account={account} catalog={catalog} isAdmin={false} onChanged={onChanged} />
      </FeedbackContext.Provider>
    );

    await user.click(screen.getByRole("button", { name: "+ Agregar consumo" }));
    await user.selectOptions(screen.getByLabelText("Servicio *"), "17");
    await user.clear(screen.getByLabelText("Cantidad *"));
    await user.type(screen.getByLabelText("Cantidad *"), "2");
    await user.click(screen.getByRole("button", { name: "Agregar consumo" }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith("La cuenta tiene una factura emitida", "error"));
    expect(screen.getByLabelText("Servicio *")).toHaveValue("17");
    expect(screen.getByLabelText("Cantidad *")).toHaveValue(2);
    expect(screen.getByRole("button", { name: "Agregar consumo" })).toBeEnabled();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
