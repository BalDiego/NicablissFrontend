import { apiClient } from "./apiClient";
import type { Guest } from "./types";

export const guestService = {
  async getAll(search?: string): Promise<Guest[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiClient.get<{ success: boolean; data: Guest[] }>(`/guests${query}`);
    return res.data;
  },

  async getById(id: number): Promise<Guest> {
    const res = await apiClient.get<{ success: boolean; data: Guest }>(`/guests/${id}`);
    return res.data;
  },

  async create(guest: Omit<Guest, "id">): Promise<Guest> {
    const res = await apiClient.post<{ success: boolean; data: Guest }>("/guests", guest);
    return res.data;
  },

  async updateStatus(id: number, estado: Guest["estado"]): Promise<Guest> {
    const res = await apiClient.patch<{ success: boolean; data: Guest }>(`/guests/${id}/status`, { estado });
    return res.data;
  },
};
