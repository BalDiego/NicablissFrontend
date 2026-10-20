import { apiClient } from "./apiClient";
import type { CashSession, TipoMovimiento, ConceptoMovimiento, MetodoPago } from "./types";

export const cashService = {
  async getCurrentSession(): Promise<CashSession | null> {
    const res = await apiClient.get<{ success: boolean; data: CashSession | null }>("/cash-register/current");
    return res.data;
  },

  async openSession(responsable: string, fondoInicial: number): Promise<CashSession> {
    const res = await apiClient.post<{ success: boolean; data: CashSession }>("/cash-register/open", {
      responsable,
      fondoInicial,
    });
    return res.data;
  },

  async addMovement(movement: {
    tipo: TipoMovimiento;
    concepto: ConceptoMovimiento;
    descripcion: string;
    metodo: MetodoPago;
    monto: number;
  }): Promise<CashSession> {
    const res = await apiClient.post<{ success: boolean; data: CashSession }>("/cash-register/movements", movement);
    return res.data;
  },

  async closeSession(efectivoContado: number, observaciones?: string): Promise<CashSession> {
    const res = await apiClient.post<{ success: boolean; data: CashSession }>("/cash-register/close", {
      efectivoContado,
      observaciones,
    });
    return res.data;
  },

  async getHistory(): Promise<CashSession[]> {
    const res = await apiClient.get<{ success: boolean; count: number; data: CashSession[] }>("/cash-register/history");
    return res.data;
  },
};
