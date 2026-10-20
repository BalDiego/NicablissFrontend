import { apiClient } from "./apiClient";
import type { DashboardMetrics } from "./types";

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await apiClient.get<{ success: boolean; data: DashboardMetrics }>("/dashboard/metrics");
    return res.data;
  },
};
