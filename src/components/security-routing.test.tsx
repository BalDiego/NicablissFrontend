import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "../contexts/auth-context";
import type { User, UserRole } from "../services/types";
import ForbiddenPage from "../pages/ForbiddenPage";
import RoleGuard from "./RoleGuard";

function renderAs(role: UserRole) {
  const user: User = {
    id: `usr_${role.toLowerCase()}`,
    username: role.toLowerCase(),
    email: `${role.toLowerCase()}@nicabliss.test`,
    fullName: `Usuario ${role}`,
    role,
    createdAt: "2026-10-24T00:00:00.000Z",
  };
  const value: AuthContextValue = {
    user,
    initializing: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/financial"]}>
        <Routes>
          <Route element={<RoleGuard allowedRoles={["ADMIN", "RECEPTIONIST"]} />}>
            <Route path="financial" element={<h1>Información financiera</h1>} />
          </Route>
          <Route path="403" element={<ForbiddenPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("security routing", () => {
  it("redirects STAFF to the 403 screen without rendering financial content", () => {
    renderAs("STAFF");
    expect(screen.getByRole("heading", { name: "Acceso no autorizado" })).toBeInTheDocument();
    expect(screen.queryByText("Información financiera")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio autorizado" })).toHaveAttribute("href", "/");
  });

  it("renders the protected module for an authorized role", () => {
    renderAs("RECEPTIONIST");
    expect(screen.getByRole("heading", { name: "Información financiera" })).toBeInTheDocument();
  });
});
