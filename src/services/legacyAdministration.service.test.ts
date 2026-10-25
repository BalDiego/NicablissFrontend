import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { legacyAdministrationService } from "./legacyAdministration.service";

const apiUrl = "http://localhost:4000/api/v1";
const server = setupServer();

beforeAll(() => {
  localStorage.setItem("nicabliss_token", "admin-token");
  server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  localStorage.clear();
});

describe("legacy administration API contracts", () => {
  it("loads filtered historical balances with authentication", async () => {
    server.use(http.get(`${apiUrl}/legacy-administration/historical-accounts`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("search")).toBe("Carlos");
      expect(url.searchParams.get("openOnly")).toBe("true");
      expect(request.headers.get("authorization")).toBe("Bearer admin-token");
      return HttpResponse.json({
        success: true,
        data: { accounts: [{ id: 2, sourceId: "1002", balance: 12.5 }], summary: { accountCount: 3, openCount: 2, total: 60.5, paid: 43, balance: 17.5 } },
      });
    }));

    const result = await legacyAdministrationService.getHistoricalAccounts("Carlos", true);
    expect(result.accounts[0].balance).toBe(12.5);
    expect(result.summary.balance).toBe(17.5);
  });

  it("sends the mandatory reason when accepting an unlinked review", async () => {
    server.use(http.patch(`${apiUrl}/legacy-administration/reviews/41/accept-unlinked`, async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "No existe evidencia suficiente" });
      return HttpResponse.json({ success: true, data: { id: 41, sourceTable: "food_orders", sourceId: "9", status: "SKIPPED", resolution: "ACCEPTED_UNLINKED" } });
    }));

    const result = await legacyAdministrationService.acceptUnlinked(41, "No existe evidencia suficiente");
    expect(result.resolution).toBe("ACCEPTED_UNLINKED");
  });
});
