import { apiClient } from "./apiClient";
import type { DashboardMetrics } from "./types";
import type { DailyDashboardReport, MetodoPago } from "./types";
import { reportService } from "./report.service";

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await apiClient.get<{ success: boolean; data: DashboardMetrics }>("/dashboard/metrics");
    return res.data;
  },
  async getDaily(date: string, method?: MetodoPago, category?: string, options?: { force?: boolean }): Promise<DailyDashboardReport> {
    return reportService.getDashboard(date, method, category, options);
  },
};
