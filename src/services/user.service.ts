import { apiClient } from "./apiClient";
import type { User, CreateUserPayload, UpdateUserPayload } from "./types";

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await apiClient.get<{ success: boolean; count: number; data: User[] }>("/users");
    return res.data;
  },

  async getById(id: string): Promise<User> {
    const res = await apiClient.get<{ success: boolean; data: User }>(`/users/${id}`);
    return res.data;
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const res = await apiClient.post<{ success: boolean; data: User }>("/users", payload);
    return res.data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
  },
};
