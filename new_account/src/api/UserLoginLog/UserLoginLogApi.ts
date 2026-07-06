import api from "../apiClient";

export interface UserLoginLogRow {
  id: number;
  user_id: number | null;
  email: string | null;
  full_name: string | null;
  user_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_summary: string | null;
  browser: string | null;
  platform: string | null;
  success: boolean;
  logged_in_at: string;
}

export interface UserLoginLogResponse {
  data: UserLoginLogRow[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const getUserLoginLogs = async (params?: {
  email?: string;
  role?: string;
  fromDate?: string;
  toDate?: string;
  success?: boolean;
  page?: number;
  per_page?: number;
}): Promise<UserLoginLogResponse> => {
  const { data } = await api.get("/user-login-logs", { params });
  return data;
};

