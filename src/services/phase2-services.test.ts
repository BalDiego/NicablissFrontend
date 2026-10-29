import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { foodOrderService } from "./foodOrder.service";
import { laundryService } from "./laundry.service";
import { reservationService } from "./reservation.service";
import { serviceService } from "./service.service";
import { stayService } from "./stay.service";
import { invoiceService } from "./invoice.service";
import { cashService } from "./cash.service";
import { reportService } from "./report.service";
import { attendanceService } from "./attendance.service";
import { apiClient } from "./apiClient";

const apiUrl = "http://localhost:4000/api/v1";

const stay = {
  id: 9,
  reservationId: 21,
  reservationCode: "RES-2028-000021",
  customerId: 7,
  customerName: "Cliente Prueba",
  customerDocument: "DOC-7",
  roomId: 3,
  habitacion: "Habitación 03",
  checkInAt: "2028-03-10T14:00:00.000Z",
  estado: "Activa" as const,
  createdBy: "usr_admin_001",
  createdAt: "2028-03-10T14:00:00.000Z",
  updatedAt: "2028-03-10T14:00:00.000Z",
};

const server = setupServer();

beforeAll(() => {
  localStorage.setItem("nicabliss_token", "test-token");
  server.listen();
});

afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.clear();
});

describe("Phase 2 API contracts", () => {
  it("loads active stays and performs check-in with authenticated requests", async () => {
    server.use(
      http.get(`${apiUrl}/stays`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("status")).toBe("Activa");
        expect(request.headers.get("authorization")).toBe("Bearer test-token");
        return HttpResponse.json({ success: true, data: [stay] });
      }),
      http.post(`${apiUrl}/reservations/21/check-in`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer test-token");
        return HttpResponse.json({ success: true, data: stay }, { status: 201 });
      })
    );

    await expect(stayService.getAll("Activa")).resolves.toEqual([stay]);
    await expect(reservationService.checkIn(21)).resolves.toEqual(stay);
  });

  it("sends stayId instead of free-form guest data for food and laundry", async () => {
    server.use(
      http.post(`${apiUrl}/food-orders`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ stayId: 9, productos: "Cena", total: 12.5 });
        expect(body).not.toHaveProperty("huesped");
        expect(body).not.toHaveProperty("habitacion");
        return HttpResponse.json({ success: true, data: { id: 30, ...body } }, { status: 201 });
      }),
      http.post(`${apiUrl}/laundry`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({
          stayId: 9,
          prendas: [{ tipo: "Camisa", cantidad: 2 }],
          observaciones: "Delicado",
        });
        expect(body).not.toHaveProperty("huesped");
        return HttpResponse.json({ success: true, data: { id: 31, ...body } }, { status: 201 });
      })
    );

    await foodOrderService.create({ stayId: 9, productos: "Cena", total: 12.5 });
    await laundryService.create({
      stayId: 9,
      prendas: [{ tipo: "Camisa", cantidad: 2 }],
      observaciones: "Delicado",
    });
  });

  it("creates a stay consumption and updates its lifecycle status", async () => {
    server.use(
      http.post(`${apiUrl}/stays/9/services`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ serviceId: 4, cantidad: 2, observaciones: "Minibar" });
        return HttpResponse.json({
          success: true,
          data: { id: 40, stayId: 9, ...body, estado: "Registrado", subtotal: 6.5 },
        }, { status: 201 });
      }),
      http.patch(`${apiUrl}/service-consumptions/40/status`, async ({ request }) => {
        expect(await request.json()).toEqual({ estado: "Consumido" });
        return HttpResponse.json({ success: true, data: { id: 40, estado: "Consumido" } });
      })
    );

    const created = await serviceService.createConsumption(9, {
      serviceId: 4,
      cantidad: 2,
      observaciones: "Minibar",
    });
    expect(created.estado).toBe("Registrado");

    const updated = await serviceService.updateStatus(40, "Consumido");
    expect(updated.estado).toBe("Consumido");
  });

  it("creates, issues, pays, and downloads an internal invoice", async () => {
    server.use(
      http.post(`${apiUrl}/invoices`, async ({ request }) => {
        expect(await request.json()).toEqual({ stayId: 9 });
        return HttpResponse.json({ success: true, data: { id: 50, invoiceNumber: "INV-2028-0000050", status: "Borrador" } }, { status: 201 });
      }),
      http.post(`${apiUrl}/invoices/50/issue`, () => {
        return HttpResponse.json({ success: true, data: { id: 50, invoiceNumber: "INV-2028-0000050", status: "Emitida" } });
      }),
      http.post(`${apiUrl}/invoices/50/payments`, async ({ request }) => {
        expect(request.headers.get("idempotency-key")).toBe("invoice-key-50");
        expect(await request.json()).toEqual({ amount: 25, paymentMethod: "Tarjeta", reference: "CARD-50" });
        return HttpResponse.json({ success: true, data: { id: 60, invoiceId: 50, amount: 25 } }, { status: 201 });
      }),
      http.get(`${apiUrl}/invoices/50/pdf`, () => {
        return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
          headers: { "Content-Type": "application/pdf" },
        });
      })
    );

    const draft = await invoiceService.create(9);
    expect(draft.status).toBe("Borrador");
    const issued = await invoiceService.issue(50);
    expect(issued.status).toBe("Emitida");
    const payment = await invoiceService.pay(50, {
      amount: 25,
      paymentMethod: "Tarjeta",
      reference: "CARD-50",
    }, "invoice-key-50");
    expect(payment.invoiceId).toBe(50);
    const pdf = await invoiceService.downloadPdf(50);
    expect(pdf.type).toBe("application/pdf");
    expect(pdf.size).toBe(4);
  });

  it("requests cash reconciliation with method and user filters", async () => {
    server.use(
      http.get(`${apiUrl}/reports/cash/reconciliation`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("sessionId")).toBe("77");
        expect(params.get("method")).toBe("Tarjeta");
        expect(params.get("userId")).toBe("usr_admin_001");
        return HttpResponse.json({
          success: true,
          data: { balanced: true, totals: { netPayments: 25, netMovements: 25 }, items: [] },
        });
      }),
      http.get(`${apiUrl}/reports/cash/by-method`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("sessionId")).toBe("77");
        expect(params.get("userId")).toBe("usr_admin_001");
        expect(params.has("method")).toBe(false);
        return HttpResponse.json({ success: true, data: { sessionId: 77, rows: [{ method: "Tarjeta", netPayments: 25 }] } });
      }),
      http.get(`${apiUrl}/reports/cash/by-user`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("sessionId")).toBe("77");
        expect(params.get("method")).toBe("Tarjeta");
        return HttpResponse.json({ success: true, data: { sessionId: 77, rows: [{ userId: "usr_admin_001", userName: "Admin" }] } });
      })
    );

    const reconciliation = await cashService.getReconciliation(77, "Tarjeta", "usr_admin_001");
    expect(reconciliation.balanced).toBe(true);
    expect(reconciliation.totals.netPayments).toBe(25);
    const byMethod = await cashService.getByMethod(77, "usr_admin_001");
    expect(byMethod.rows[0].method).toBe("Tarjeta");
    const byUser = await cashService.getByUser(77, "Tarjeta");
    expect(byUser.rows[0].userId).toBe("usr_admin_001");
  });

  it("opens cash without accepting a client-supplied responsible and sends movement idempotency keys", async () => {
    server.use(
      http.post(`${apiUrl}/cash-register/open`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ fondoInicial: 50 });
        return HttpResponse.json({
          success: true,
          data: { id: 88, responsable: "Administrador Nicabliss", openedBy: "usr_admin_001" },
        }, { status: 201 });
      }),
      http.post(`${apiUrl}/cash-register/movements`, async ({ request }) => {
        expect(request.headers.get("Idempotency-Key")).toBe("cash-movement-key-88");
        return HttpResponse.json({ success: true, data: { id: 88, movimientos: [] } });
      })
    );

    const session = await cashService.openSession(50);
    expect(session.openedBy).toBe("usr_admin_001");
    await cashService.addMovement({
      tipo: "Ingreso",
      concepto: "Otro ingreso",
      descripcion: "Prueba de idempotencia",
      metodo: "Efectivo",
      monto: 5,
    }, "cash-movement-key-88");
  });

  it("requests administrative reports with stable date and range filters", async () => {
    server.use(
      http.get(`${apiUrl}/reports/dashboard`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("date")).toBe("2026-10-25");
        expect(params.get("method")).toBe("Transferencia");
        return HttpResponse.json({ success: true, data: { date: "2026-10-25", income: { collected: 40, invoiced: 90, pending: 50, advances: 0 } } });
      }),
      http.get(`${apiUrl}/reports/services`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("from")).toBe("2026-10-01");
        expect(params.get("to")).toBe("2026-10-25");
        expect(params.get("category")).toBe("Alimentos");
        return HttpResponse.json({ success: true, data: { from: "2026-10-01", to: "2026-10-25", totals: { revenue: 10 }, items: [] } });
      }),
      http.get(`${apiUrl}/reports/revenue/monthly`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("year")).toBe("2026");
        return HttpResponse.json({ success: true, data: { year: 2026, totals: { invoiced: 90, collected: 40, pending: 50 }, months: [] } });
      }),
      http.get(`${apiUrl}/reports/receivables`, () => HttpResponse.json({ success: true, data: { totals: { count: 1, balance: 50 }, items: [] } })),
      http.get(`${apiUrl}/reports/revenue/categories`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("from")).toBe("2026-10-01");
        expect(params.get("to")).toBe("2026-10-25");
        return HttpResponse.json({ success: true, data: { from: "2026-10-01", to: "2026-10-25", total: 90, items: [] } });
      })
    );

    expect((await reportService.getDashboard("2026-10-25", "Transferencia")).income.collected).toBe(40);
    expect((await reportService.getServices("2026-10-01", "2026-10-25", "Alimentos")).totals.revenue).toBe(10);
    expect((await reportService.getMonthly(2026)).totals.invoiced).toBe(90);
    expect((await reportService.getReceivables()).totals.balance).toBe(50);
    expect((await reportService.getCategories("2026-10-01", "2026-10-25")).total).toBe(90);
  });

  it("deduplicates dashboard reads and invalidates cached data after mutations", async () => {
    let requests = 0;
    server.use(
      http.get(`${apiUrl}/reports/dashboard`, () => {
        requests += 1;
        return HttpResponse.json({
          success: true,
          data: { date: "2026-10-26", filters: {}, income: { collected: requests, invoiced: 0, pending: 0, advances: 0 } },
        });
      })
    );

    const [first, duplicate] = await Promise.all([
      reportService.getDashboard("2026-10-26"),
      reportService.getDashboard("2026-10-26"),
    ]);
    expect(first.income.collected).toBe(1);
    expect(duplicate.income.collected).toBe(1);
    expect(requests).toBe(1);

    window.dispatchEvent(new CustomEvent("nicabliss:data-mutated"));
    expect((await reportService.getDashboard("2026-10-26")).income.collected).toBe(2);
    expect((await reportService.getDashboard("2026-10-26", undefined, undefined, { force: true })).income.collected).toBe(3);
  });

  it("registers personal attendance and requests the monthly report", async () => {
    server.use(
      http.post(`${apiUrl}/attendance/check-in`, () => HttpResponse.json({ success: true, data: { id: 1, userId: "usr_admin_001", status: "Presente" } }, { status: 201 })),
      http.get(`${apiUrl}/attendance/report`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("from")).toBe("2026-10-01"); expect(params.get("to")).toBe("2026-10-25");
        return HttpResponse.json({ success: true, data: { totals: { records: 1, late: 0, absences: 0 }, users: [], records: [] } });
      }),
      http.put(`${apiUrl}/attendance/schedules`, async ({ request }) => {
        expect(await request.json()).toEqual({ userId: "usr_admin_001", dayOfWeek: 1, startTime: "08:00", endTime: "17:00" });
        return HttpResponse.json({ success: true, data: { id: 2, userId: "usr_admin_001", dayOfWeek: 1, startTime: "08:00", endTime: "17:00", active: true } });
      })
    );
    expect((await attendanceService.checkIn()).status).toBe("Presente");
    expect((await attendanceService.report("2026-10-01", "2026-10-25")).totals.records).toBe(1);
    expect((await attendanceService.saveSchedule({ userId: "usr_admin_001", dayOfWeek: 1, startTime: "08:00", endTime: "17:00" })).active).toBe(true);
  });

  it("preserves the session on 403 and expires it with a clear API error on 401", async () => {
    server.use(
      http.get(`${apiUrl}/security/forbidden`, () => HttpResponse.json({
        success: false,
        error: { code: "FORBIDDEN", message: "No tienes permiso para esta operación" },
      }, { status: 403 })),
      http.get(`${apiUrl}/security/expired`, () => HttpResponse.json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "La sesión expiró" },
      }, { status: 401 }))
    );

    localStorage.setItem("nicabliss_token", "test-token");
    await expect(apiClient.get("/security/forbidden")).rejects.toEqual(
      expect.objectContaining({ code: "FORBIDDEN", status: 403, message: "No tienes permiso para esta operación" })
    );
    expect(localStorage.getItem("nicabliss_token")).toBe("test-token");

    const expired = vi.fn();
    window.addEventListener("nicabliss:session-expired", expired);
    await expect(apiClient.get("/security/expired")).rejects.toEqual(
      expect.objectContaining({ code: "TOKEN_EXPIRED", status: 401, message: "La sesión expiró" })
    );
    expect(localStorage.getItem("nicabliss_token")).toBeNull();
    expect(expired).toHaveBeenCalledOnce();
    window.removeEventListener("nicabliss:session-expired", expired);
  });
});
