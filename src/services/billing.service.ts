import { apiClient } from "./apiClient";
import type { BillingAccount, BillingResponse } from "./types";

export const billingService = {
  async getAll(search?: string): Promise<BillingResponse> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiClient.get<{ success: boolean; cuentas: BillingAccount[]; resumen: BillingResponse["resumen"] }>(
      `/billing${query}`
    );
    return {
      cuentas: res.cuentas,
      resumen: res.resumen,
    };
  },

  async create(account: {
    huesped: string;
    habitacion: string;
    concepto: string;
    total: number;
  }): Promise<BillingAccount> {
    const res = await apiClient.post<{ success: boolean; data: BillingAccount }>("/billing", account);
    return res.data;
  },

  async recordPayment(id: number, monto: number): Promise<BillingAccount> {
    const res = await apiClient.post<{ success: boolean; data: BillingAccount }>(
      `/billing/${id}/payments`,
      { monto }
    );
    return res.data;
  },
};
