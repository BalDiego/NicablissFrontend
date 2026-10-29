import { apiClient } from "./apiClient";
import type {
  CashByMethodReport,
  CashByUserReport,
  CashReconciliation,
  CashSession,
  TipoMovimiento,
  ConceptoMovimiento,
  MetodoPago,
} from "./types";

function reportQuery(sessionId: number, method?: MetodoPago, userId?: string): string {
  const params = new URLSearchParams({ sessionId: String(sessionId) });
  if (method) params.set("method", method);
  if (userId) params.set("userId", userId);
  return params.toString();
}

export const cashService = {
  async getCurrentSession(): Promise<CashSession | null> {
    const res = await apiClient.get<{ success: boolean; data: CashSession | null }>("/cash-register/current");
    return res.data;
  },

  async openSession(fondoInicial: number): Promise<CashSession> {
    const res = await apiClient.post<{ success: boolean; data: CashSession }>("/cash-register/open", {
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
  }, idempotencyKey?: string): Promise<CashSession> {
    const res = await apiClient.post<{ success: boolean; data: CashSession }>(
      "/cash-register/movements",
      movement,
      idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined
    );
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

  async getReconciliation(sessionId: number, method?: MetodoPago, userId?: string): Promise<CashReconciliation> {
    const res = await apiClient.get<{ success: boolean; data: CashReconciliation }>(
      `/reports/cash/reconciliation?${reportQuery(sessionId, method, userId)}`
    );
    return res.data;
  },

  async getByMethod(sessionId: number, userId?: string): Promise<CashByMethodReport> {
    const res = await apiClient.get<{ success: boolean; data: CashByMethodReport }>(
      `/reports/cash/by-method?${reportQuery(sessionId, undefined, userId)}`
    );
    return res.data;
  },

  async getByUser(sessionId: number, method?: MetodoPago): Promise<CashByUserReport> {
    const res = await apiClient.get<{ success: boolean; data: CashByUserReport }>(
      `/reports/cash/by-user?${reportQuery(sessionId, method)}`
    );
    return res.data;
  },
};
