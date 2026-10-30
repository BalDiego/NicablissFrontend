import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { CustomerHistory } from "../../services/types";
import CustomerStayHistory from "./CustomerStayHistory";

afterEach(cleanup);

const history: CustomerHistory = {
  customer: {
    id: 7,
    nombre: "Cliente",
    apellido: "Historial",
    documento: "DOC-7",
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  },
  activeStay: null,
  stays: [{
    stayId: 9,
    reservationId: 21,
    reservationCode: "RES-2026-000021",
    reservationStatus: "Finalizada",
    customerId: 7,
    customerName: "Cliente Historial",
    customerDocument: "DOC-7",
    roomId: 3,
    habitacion: "Habitación 03",
    checkInAt: "2026-10-01T14:00:00.000Z",
    checkOutAt: "2026-10-03T11:00:00.000Z",
    status: "Finalizada",
    lodging: 200,
    services: 25,
    pendingServicesAmount: 0,
    total: 225,
    paid: 50,
    balance: 175,
    billableServiceCount: 1,
    pendingServiceCount: 0,
    payments: [{
      id: 70,
      paymentNumber: "PAY-2026-0000070",
      amount: 50,
      paymentMethod: "Efectivo",
      kind: "PAYMENT",
      status: "POSTED",
      paymentDate: "2026-10-03T12:00:00.000Z",
      receivedByName: "Administrador Nicabliss",
    }],
  }],
  summary: {
    stayCount: 1,
    activeStayCount: 0,
    totalCharged: 225,
    totalPaid: 50,
    outstandingBalance: 175,
  },
};

describe("CustomerStayHistory", () => {
  it("shows the outstanding balance, collection link, and payments per stay", () => {
    render(
      <MemoryRouter>
        <CustomerStayHistory history={history} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Historial de estancias" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cobrar saldo" })).toHaveAttribute("href", "/reservations/21");
    expect(screen.getByText("Pagos por estancia")).toBeInTheDocument();
    expect(screen.getByText("PAY-2026-0000070")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getAllByText("$175.00").length).toBeGreaterThan(0);
  });
});
