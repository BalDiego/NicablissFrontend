import { describe, expect, it } from "vitest";
import { hasAnyRole, hasPermission } from "./permissions";

describe("permissions", () => {
  it("reserva la administración de usuarios para ADMIN", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("RECEPTIONIST", "users:manage")).toBe(false);
    expect(hasPermission("STAFF", "users:manage")).toBe(false);
  });

  it("permite al personal operativo acceder a servicios, no a caja", () => {
    expect(hasPermission("STAFF", "services:manage")).toBe(true);
    expect(hasPermission("STAFF", "cash:manage")).toBe(false);
    expect(hasAnyRole("STAFF", ["ADMIN", "RECEPTIONIST"])).toBe(false);
  });
});
