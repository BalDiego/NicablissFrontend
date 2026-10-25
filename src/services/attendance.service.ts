import { apiClient, type ApiSuccess } from "./apiClient";
import type { AttendanceRecord, AttendanceReportData, AttendanceStatus, StaffSchedule } from "./types";

function query(values: Record<string, string | undefined>) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); }); return params.size ? `?${params}` : ""; }
export const attendanceService = {
  async checkIn() { return (await apiClient.post<ApiSuccess<AttendanceRecord>>("/attendance/check-in")).data; },
  async checkOut() { return (await apiClient.post<ApiSuccess<AttendanceRecord>>("/attendance/check-out")).data; },
  async today() { return (await apiClient.get<ApiSuccess<AttendanceRecord[]>>("/attendance/today")).data; },
  async getAll(from: string, to: string, userId?: string, status?: AttendanceStatus) { return (await apiClient.get<ApiSuccess<AttendanceRecord[]>>(`/attendance${query({ from, to, userId, status })}`)).data; },
  async absence(payload: { userId: string; attendanceDate: string; status: "Ausente" | "Permiso" | "Incapacidad"; justification: string }) { return (await apiClient.post<ApiSuccess<AttendanceRecord>>("/attendance/absence", payload)).data; },
  async update(id: number, payload: Partial<Pick<AttendanceRecord, "checkIn" | "checkOut" | "status" | "justification">>) { return (await apiClient.put<ApiSuccess<AttendanceRecord>>(`/attendance/${id}`, payload)).data; },
  async report(from: string, to: string, userId?: string) { return (await apiClient.get<ApiSuccess<AttendanceReportData>>(`/attendance/report${query({ from, to, userId })}`)).data; },
  async getSchedules(userId?: string) { return (await apiClient.get<ApiSuccess<StaffSchedule[]>>(`/attendance/schedules${query({ userId })}`)).data; },
  async saveSchedule(payload: { userId: string; dayOfWeek: number; startTime: string; endTime: string; active?: boolean }) { return (await apiClient.put<ApiSuccess<StaffSchedule>>("/attendance/schedules", payload)).data; },
};
