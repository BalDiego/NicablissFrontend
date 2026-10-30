import { apiClient } from "./apiClient";
import type { FoodOrder } from "./types";

export interface FoodOrderPayload {
  stayId?: number;
  reservationId?: number;
  productos: string;
  total: number;
}

export const foodOrderService = {
  async getAll(search?: string): Promise<FoodOrder[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiClient.get<{ success: boolean; data: FoodOrder[] }>(`/food-orders${query}`);
    return res.data;
  },

  async create(order: FoodOrderPayload): Promise<FoodOrder> {
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
