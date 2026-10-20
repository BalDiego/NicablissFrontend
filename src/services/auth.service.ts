import { apiClient } from "./apiClient";
import type { AuthResponse, User } from "./types";

export const authService = {
  async login(usuario: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      "/auth/login",
      { usuario, password }
    );
    const authData = response.data;
    localStorage.setItem("nicabliss_token", authData.token);
    localStorage.setItem("nicabliss_user", JSON.stringify(authData.user));
    return authData;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>("/auth/me");
    localStorage.setItem("nicabliss_user", JSON.stringify(response.data));
    return response.data;
  },

  logout(): void {
    localStorage.removeItem("nicabliss_token");
    localStorage.removeItem("nicabliss_user");
  },

  getStoredToken(): string | null {
    return localStorage.getItem("nicabliss_token");
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem("nicabliss_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};
