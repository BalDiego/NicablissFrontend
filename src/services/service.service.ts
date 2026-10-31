import { apiClient, type ApiSuccess } from "./apiClient";
import type {
  ConsumptionStatus,
  ServiceCatalog,
  ServiceCategory,
  ServiceConsumption,
} from "./types";

export interface CatalogPayload {
  nombre: string;
  categoria: ServiceCategory;
  descripcion?: string;
  precio: number;
  impuesto?: number;
  activo?: boolean;
}

export interface ConsumptionPayload {
  serviceId: number;
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}

export interface UpdateConsumptionPayload {
  cantidad?: number;
  precioUnitario?: number;
  observaciones?: string;
}

export const serviceService = {
  async getCatalog(includeInactive = false): Promise<ServiceCatalog[]> {
    const query = includeInactive ? "?includeInactive=true" : "";
    const response = await apiClient.get<ApiSuccess<ServiceCatalog[]>>(`/service-catalog${query}`);
    return response.data;
  },

  async createCatalog(payload: CatalogPayload): Promise<ServiceCatalog> {
    const response = await apiClient.post<ApiSuccess<ServiceCatalog>>("/service-catalog", payload);
    return response.data;
  },

  async updateCatalog(id: number, payload: Partial<CatalogPayload>): Promise<ServiceCatalog> {
    const response = await apiClient.put<ApiSuccess<ServiceCatalog>>(`/service-catalog/${id}`, payload);
    return response.data;
  },

  async getByStay(stayId: number): Promise<ServiceConsumption[]> {
    const response = await apiClient.get<ApiSuccess<ServiceConsumption[]>>(`/stays/${stayId}/services`);
    return response.data;
  },

  async createConsumption(stayId: number, payload: ConsumptionPayload): Promise<ServiceConsumption> {
    const response = await apiClient.post<ApiSuccess<ServiceConsumption>>(`/stays/${stayId}/services`, payload);
    return response.data;
  },

  async updateStatus(id: number, estado: ConsumptionStatus): Promise<ServiceConsumption> {
    const response = await apiClient.patch<ApiSuccess<ServiceConsumption>>(
      `/service-consumptions/${id}/status`,
      { estado }
    );
    return response.data;
  },

  async updateConsumption(id: number, payload: UpdateConsumptionPayload): Promise<ServiceConsumption> {
    const response = await apiClient.put<ApiSuccess<ServiceConsumption>>(
      `/service-consumptions/${id}`,
      payload
    );
    return response.data;
  },
};
