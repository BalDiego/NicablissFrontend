import { apiClient, type ApiSuccess } from "./apiClient";
import type {
  Payment,
  PaymentReceipt,
  Reservation,
  ReservationAccount,
  ReservationStatus,
  Room,
  ServiceConsumption,
  Stay,
} from "./types";

export interface ReservationCustomerPayload {
  nombre: string;
  apellido?: string;
  documento: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export interface ReservationPayload {
  customerId?: number;
  customer?: ReservationCustomerPayload;
  roomId: number;
  fechaEntrada: string;
  fechaSalida: string;
  totalReserva?: number;
  depositType: "PERCENTAGE" | "FIXED";
  depositValue: number | string;
  observaciones?: string;
}

export interface ConsumptionPayload {
  serviceId: number;
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface ReservationCheckoutResult {
  reservationId: number;
  stay: Stay;
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    total: number;
    paidAmount: number;
    balance: number;
  };
  account: ReservationAccount;
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

  async checkout(id: number): Promise<ReservationCheckoutResult> {
    const response = await apiClient.post<ApiSuccess<ReservationCheckoutResult>>(`/reservations/${id}/checkout`);
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

  async getAccount(reservationId: number): Promise<ReservationAccount> {
    const response = await apiClient.get<ApiSuccess<ReservationAccount>>(`/reservations/${reservationId}/account`);
    return response.data;
  },

  async getConsumptions(reservationId: number): Promise<ServiceConsumption[]> {
    const response = await apiClient.get<ApiSuccess<ServiceConsumption[]>>(`/reservations/${reservationId}/consumptions`);
    return response.data;
  },

  async addConsumption(reservationId: number, payload: ConsumptionPayload): Promise<ServiceConsumption> {
    const response = await apiClient.post<ApiSuccess<ServiceConsumption>>(
      `/reservations/${reservationId}/consumptions`,
      payload
    );
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
