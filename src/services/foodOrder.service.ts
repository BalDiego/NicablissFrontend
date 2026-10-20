import { apiClient } from "./apiClient";
import type { FoodOrder } from "./types";

export const foodOrderService = {
  async getAll(search?: string): Promise<FoodOrder[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiClient.get<{ success: boolean; data: FoodOrder[] }>(`/food-orders${query}`);
    return res.data;
  },

  async create(order: {
    huesped: string;
    habitacion: string;
    productos: string;
    total: number;
  }): Promise<FoodOrder> {
    const res = await apiClient.post<{ success: boolean; data: FoodOrder }>("/food-orders", order);
    return res.data;
  },

  async updateStatus(id: number, estado: FoodOrder["estado"]): Promise<FoodOrder> {
    const res = await apiClient.patch<{ success: boolean; data: FoodOrder }>(
      `/food-orders/${id}/status`,
      { estado }
    );
    return res.data;
  },
};
