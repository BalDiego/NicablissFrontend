import { apiClient, type ApiSuccess } from "./apiClient";
import type { Invoice, InvoiceStatus, MetodoPago, Payment } from "./types";

export const invoiceService = {
  async getAll(search?: string, status?: InvoiceStatus): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const query = params.size ? `?${params}` : "";
    const response = await apiClient.get<ApiSuccess<Invoice[]>>(`/invoices${query}`);
    return response.data;
  },

  async getById(id: number): Promise<Invoice> {
    const response = await apiClient.get<ApiSuccess<Invoice>>(`/invoices/${id}`);
    return response.data;
  },

  async create(stayId: number): Promise<Invoice> {
    const response = await apiClient.post<ApiSuccess<Invoice>>("/invoices", { stayId });
    return response.data;
  },

  async issue(id: number): Promise<Invoice> {
    const response = await apiClient.post<ApiSuccess<Invoice>>(`/invoices/${id}/issue`);
    return response.data;
  },

  async void(id: number, reason: string): Promise<Invoice> {
    const response = await apiClient.post<ApiSuccess<Invoice>>(`/invoices/${id}/void`, { reason });
    return response.data;
  },

  async pay(
    id: number,
    payload: { amount: number; paymentMethod: MetodoPago; reference?: string },
    idempotencyKey: string
  ): Promise<Payment> {
    const response = await apiClient.post<ApiSuccess<Payment>>(
      `/invoices/${id}/payments`,
      payload,
      { "Idempotency-Key": idempotencyKey }
    );
    return response.data;
  },

  async downloadPdf(id: number): Promise<Blob> {
    return apiClient.getBlob(`/invoices/${id}/pdf`);
  },
};
