import { apiClient, type ApiSuccess } from "./apiClient";
import type { Stay, StayAccount, StayStatus } from "./types";

export const stayService = {
  async getAll(status?: StayStatus): Promise<Stay[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await apiClient.get<ApiSuccess<Stay[]>>(`/stays${query}`);
    return response.data;
  },

  async getById(id: number): Promise<Stay> {
    const response = await apiClient.get<ApiSuccess<Stay>>(`/stays/${id}`);
    return response.data;
  },

  async getAccount(id: number): Promise<StayAccount> {
    const response = await apiClient.get<ApiSuccess<StayAccount>>(`/stays/${id}/account`);
    return response.data;
  },

  async checkOut(id: number): Promise<Stay> {
    const response = await apiClient.post<ApiSuccess<Stay>>(`/stays/${id}/check-out`);
    return response.data;
  },
};
