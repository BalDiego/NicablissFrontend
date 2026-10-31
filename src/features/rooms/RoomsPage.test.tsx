import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackContext } from "../../contexts/feedback-context";
import { roomService } from "../../services/room.service";
import type { Room } from "../../services/types";
import RoomsPage from "./RoomsPage";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "ADMIN" } }),
}));

vi.mock("../../services/room.service", () => ({
  roomService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

const zeroPriceRoom: Room = {
  id: 2,
  code: "02",
  name: "Habitación 02",
  category: "Estándar",
  description: "",
  pricePerNight: 0,
  active: true,
  available: true,
};

describe("RoomsPage price editing", () => {
  const notify = vi.fn();

  beforeEach(() => {
    vi.mocked(roomService.getAll).mockResolvedValue([zeroPriceRoom]);
    vi.mocked(roomService.update).mockReset();
    vi.mocked(roomService.create).mockReset();
    notify.mockReset();
  });

  afterEach(() => cleanup());

  it("opens an unconfigured zero-rate room with a blank price field for direct entry", async () => {
    vi.mocked(roomService.update).mockResolvedValue({ ...zeroPriceRoom, pricePerNight: 85.5 });
    const user = userEvent.setup();

    render(
      <FeedbackContext.Provider value={{ notify, confirm: vi.fn().mockResolvedValue(true) }}>
        <RoomsPage />
      </FeedbackContext.Provider>
    );

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    const priceInput = screen.getByLabelText("Precio por noche (USD) *");
    expect(priceInput).toHaveValue("");
    await user.type(priceInput, "85.50");
    await user.click(screen.getByRole("button", { name: "Guardar habitación" }));

    await waitFor(() => expect(roomService.update).toHaveBeenCalledWith(2, expect.objectContaining({
      pricePerNight: 85.5,
    })));
    expect(notify).toHaveBeenCalledWith("Habitación actualizada");
  });

  it("rejects leaving the rate blank before calling the API", async () => {
    const user = userEvent.setup();

    render(
      <FeedbackContext.Provider value={{ notify, confirm: vi.fn().mockResolvedValue(true) }}>
        <RoomsPage />
      </FeedbackContext.Provider>
    );

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Guardar habitación" }));

    expect(roomService.update).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      "Ingresa un precio por noche mayor que $0.00, con hasta dos decimales",
      "error"
    );
  });
});
