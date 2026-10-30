import { apiClient, type ApiSuccess } from "./apiClient";
import type {
  Payment,
  PaymentReceipt,
  Reservation,
  ReservationStatus,
  Room,
  Stay,
  StayAccount,
} from "./types";

export interface ReservationPayload {
  customerId: number;
  roomId: number;
  fechaEntrada: string;
  fechaSalida: string;
  totalReserva: number;
  depositType: "PERCENTAGE" | "FIXED";
  depositValue: number;
  observaciones?: string;
}

export const reservationService = {
  async getAll(search?: string, status?: ReservationStatus): Promise<Reservation[]> {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const query = params.size > 0 ? `?${params}` : "";
    const response = await apiClient.get<ApiSuccess<Reservation[]>>(`/reservations${query}`);
    return response.data;
  },

  async getById(id: number): Promise<Reservation> {
    const response = await apiClient.get<ApiSuccess<Reservation>>(`/reservations/${id}`);
    return response.data;
  },

  async create(payload: ReservationPayload): Promise<Reservation> {
    const response = await apiClient.post<ApiSuccess<Reservation>>("/reservations", payload);
    return response.data;
  },

  async updateStatus(id: number, estado: ReservationStatus): Promise<Reservation> {
    const response = await apiClient.patch<ApiSuccess<Reservation>>(`/reservations/${id}/status`, { estado });
    return response.data;
  },

  async checkIn(id: number): Promise<Stay> {
    const response = await apiClient.post<ApiSuccess<Stay>>(`/reservations/${id}/check-in`);
    return response.data;
  },

  async getRooms(from?: string, to?: string): Promise<Room[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.size > 0 ? `?${params}` : "";
    const response = await apiClient.get<ApiSuccess<Room[]>>(`/rooms/availability${query}`);
    return response.data;
  },

  async getAccount(reservationId: number): Promise<StayAccount> {
    const response = await apiClient.get<ApiSuccess<StayAccount>>(`/reservations/${reservationId}/account`);
    return response.data;
  },

  async getPayments(reservationId: number): Promise<Payment[]> {
    const response = await apiClient.get<ApiSuccess<Payment[]>>(`/reservations/${reservationId}/payments`);
    return response.data;
  },

  async createPayment(
    reservationId: number,
    payload: { amount: number; paymentMethod: Payment["paymentMethod"]; reference?: string },
    idempotencyKey: string
  ): Promise<Payment> {
    const response = await apiClient.post<ApiSuccess<Payment>>(
      `/reservations/${reservationId}/payments`,
      payload,
      { "Idempotency-Key": idempotencyKey }
    );
    return response.data;
  },

  async voidPayment(paymentId: number, reason: string): Promise<Payment> {
    const response = await apiClient.post<ApiSuccess<Payment>>(`/payments/${paymentId}/void`, { reason });
    return response.data;
  },

  async getReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.get<ApiSuccess<PaymentReceipt>>(`/payments/${paymentId}/receipt`);
    return response.data;
  },
};
