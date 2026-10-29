import { describe, expect, it } from "vitest";
import { businessToday, formatBusinessDateTime } from "./businessDate";

describe("business date helpers", () => {
  it("uses Managua date across the UTC year boundary", () => {
    expect(businessToday(new Date("2027-01-01T05:59:00.000Z"))).toBe("2026-12-31");
    expect(businessToday(new Date("2027-01-01T06:00:00.000Z"))).toBe("2027-01-01");
  });

  it("formats timestamps in the business timezone", () => {
    expect(formatBusinessDateTime("2027-01-01T05:59:00.000Z")).toContain("31/12/2026");
  });
});
