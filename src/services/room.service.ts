import { apiClient, type ApiSuccess } from "./apiClient";
import type { Room } from "./types";

export interface RoomPayload {
  code: string;
  name: string;
  category?: string;
  description?: string;
  pricePerNight?: number;
  active?: boolean;
}

export const roomService = {
  async getAll(includeInactive = true): Promise<Room[]> {
    const query = includeInactive ? "" : "?includeInactive=false";
    const response = await apiClient.get<ApiSuccess<Room[]>>(`/rooms${query}`);
    return response.data;
  },

  async getById(id: number): Promise<Room> {
    const response = await apiClient.get<ApiSuccess<Room>>(`/rooms/${id}`);
    return response.data;
  },

  async create(payload: RoomPayload): Promise<Room> {
    const response = await apiClient.post<ApiSuccess<Room>>("/rooms", payload);
    return response.data;
  },

  async update(id: number, payload: Partial<RoomPayload>): Promise<Room> {
    const response = await apiClient.put<ApiSuccess<Room>>(`/rooms/${id}`, payload);
    return response.data;
  },

  async deactivate(id: number): Promise<Room> {
    const response = await apiClient.delete<ApiSuccess<Room>>(`/rooms/${id}`);
    return response.data;
  },
};
