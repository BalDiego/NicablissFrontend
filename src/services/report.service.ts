import { apiClient, type ApiSuccess } from "./apiClient";
import type {
  DailyDashboardReport,
  MetodoPago,
  MonthlyRevenueReportData,
  ReceivablesReportData,
  RevenueCategoriesReport,
  ServicesReport,
} from "./types";

export const reportService = {
  async getDashboard(date: string, method?: MetodoPago, category?: string): Promise<DailyDashboardReport> {
    const params = new URLSearchParams({ date });
    if (method) params.set("method", method);
    if (category) params.set("category", category);
    const response = await apiClient.get<ApiSuccess<DailyDashboardReport>>(`/reports/dashboard?${params}`);
    return response.data;
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

  async getCategories(from: string, to: string): Promise<RevenueCategoriesReport> {
    const params = new URLSearchParams({ from, to });
    const response = await apiClient.get<ApiSuccess<RevenueCategoriesReport>>(`/reports/revenue/categories?${params}`);
    return response.data;
  },
};
