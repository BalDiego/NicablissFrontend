import { apiClient } from "./apiClient";
import type { LaundryOrder, DetallePrenda } from "./types";

export const laundryService = {
  async getAll(search?: string): Promise<LaundryOrder[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiClient.get<{ success: boolean; data: LaundryOrder[] }>(`/laundry${query}`);
    return res.data;
  },

  async create(order: {
    stayId: number;
    prendas: DetallePrenda[];
    observaciones?: string;
  }): Promise<LaundryOrder> {
    const res = await apiClient.post<{ success: boolean; data: LaundryOrder }>("/laundry", order);
    return res.data;
  },

  async updateStatus(id: number, estado: LaundryOrder["estado"]): Promise<LaundryOrder> {
    const res = await apiClient.patch<{ success: boolean; data: LaundryOrder }>(
      `/laundry/${id}/status`,
      { estado }
    );
    return res.data;
  },
};
