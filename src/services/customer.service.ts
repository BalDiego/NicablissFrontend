import { apiClient, type ApiSuccess } from "./apiClient";
import type { Customer } from "./types";

export type CustomerPayload = Pick<Customer, "nombre" | "documento"> &
  Partial<Pick<Customer, "apellido" | "telefono" | "correo" | "direccion">>;

export const customerService = {
  async getAll(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await apiClient.get<ApiSuccess<Customer[]>>(`/customers${query}`);
    return response.data;
  },

  async getById(id: number): Promise<Customer> {
    const response = await apiClient.get<ApiSuccess<Customer>>(`/customers/${id}`);
    return response.data;
  },

  async create(payload: CustomerPayload): Promise<Customer> {
    const response = await apiClient.post<ApiSuccess<Customer>>("/customers", payload);
    return response.data;
  },

  async update(id: number, payload: Partial<CustomerPayload>): Promise<Customer> {
    const response = await apiClient.put<ApiSuccess<Customer>>(`/customers/${id}`, payload);
    return response.data;
  },
};
