import { apiClient, type ApiSuccess } from "./apiClient";
import type {
  DailyDashboardReport,
  MetodoPago,
  MonthlyRevenueReportData,
  ReceivablesReportData,
  RevenueCategoriesReport,
  ServicesReport,
} from "./types";

const dashboardCache = new Map<string, { data: DailyDashboardReport; expiresAt: number }>();
const dashboardRequests = new Map<string, Promise<DailyDashboardReport>>();
const DASHBOARD_CACHE_MS = 15_000;
let dashboardGeneration = 0;

if (typeof window !== "undefined") {
  window.addEventListener("nicabliss:data-mutated", () => {
    dashboardGeneration += 1;
    dashboardCache.clear();
    dashboardRequests.clear();
  });
}

export const reportService = {
  async downloadWorkbook(input: {
    period: "daily" | "weekly" | "monthly";
    date?: string;
    month?: string;
    method?: MetodoPago;
    category?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams({ period: input.period });
    if (input.date) params.set("date", input.date);
    if (input.month) params.set("month", input.month);
    if (input.method) params.set("method", input.method);
    if (input.category) params.set("category", input.category);
    return apiClient.getBlob(`/reports/export.xlsx?${params.toString()}`);
  },

  async getDashboard(date: string, method?: MetodoPago, category?: string, options: { force?: boolean } = {}): Promise<DailyDashboardReport> {
    const params = new URLSearchParams({ date });
    if (method) params.set("method", method);
    if (category) params.set("category", category);
    const key = params.toString();
    const cached = dashboardCache.get(key);
    if (!options.force && cached && cached.expiresAt > Date.now()) return cached.data;
    if (!options.force) {
      const pending = dashboardRequests.get(key);
      if (pending) return pending;
    }
    const generation = dashboardGeneration;
    const request = apiClient.get<ApiSuccess<DailyDashboardReport>>(`/reports/dashboard?${params}`)
      .then((response) => {
        if (generation === dashboardGeneration) {
          dashboardCache.set(key, { data: response.data, expiresAt: Date.now() + DASHBOARD_CACHE_MS });
        }
        return response.data;
      })
      .finally(() => {
        if (dashboardRequests.get(key) === request) dashboardRequests.delete(key);
      });
    dashboardRequests.set(key, request);
    return request;
  },

  async getServices(from: string, to: string, category?: string): Promise<ServicesReport> {
    const params = new URLSearchParams({ from, to });
    if (category) params.set("category", category);
    const response = await apiClient.get<ApiSuccess<ServicesReport>>(`/reports/services?${params}`);
    return response.data;
  },

  async getMonthly(year: number): Promise<MonthlyRevenueReportData> {
    const response = await apiClient.get<ApiSuccess<MonthlyRevenueReportData>>(`/reports/revenue/monthly?year=${year}`);
    return response.data;
  },

  async getReceivables(): Promise<ReceivablesReportData> {
    const response = await apiClient.get<ApiSuccess<ReceivablesReportData>>("/reports/receivables");
    return response.data;
  },

  async getCategories(from: string, to: string, category?: string): Promise<RevenueCategoriesReport> {
    const params = new URLSearchParams({ from, to });
    if (category) params.set("category", category);
    const response = await apiClient.get<ApiSuccess<RevenueCategoriesReport>>(`/reports/revenue/categories?${params}`);
    return response.data;
  },
};
