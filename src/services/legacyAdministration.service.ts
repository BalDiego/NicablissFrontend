import { apiClient, type ApiSuccess } from "./apiClient";
import type { HistoricalAccount, HistoricalAccountSummary, LegacyReview } from "./types";

export interface HistoricalAccountsData {
  accounts: HistoricalAccount[];
  summary: HistoricalAccountSummary;
}

export interface LegacyReviewsData {
  reviews: LegacyReview[];
  summary: { pending: number; acceptedUnlinked: number };
}

export const legacyAdministrationService = {
  async getHistoricalAccounts(search?: string, openOnly = false): Promise<HistoricalAccountsData> {
    const params = new URLSearchParams();
    if (search?.trim()) params.set("search", search.trim());
    if (openOnly) params.set("openOnly", "true");
    const query = params.size ? `?${params}` : "";
    const response = await apiClient.get<ApiSuccess<HistoricalAccountsData>>(`/legacy-administration/historical-accounts${query}`);
    return response.data;
  },

  async getReviews(includeResolved = false): Promise<LegacyReviewsData> {
    const query = includeResolved ? "?includeResolved=true" : "";
    const response = await apiClient.get<ApiSuccess<LegacyReviewsData>>(`/legacy-administration/reviews${query}`);
    return response.data;
  },

  async acceptUnlinked(id: number, reason: string): Promise<LegacyReview> {
    const response = await apiClient.patch<ApiSuccess<LegacyReview>>(
      `/legacy-administration/reviews/${id}/accept-unlinked`,
      { reason }
    );
    return response.data;
  },
};
