import api from "../apiClient";

export interface UserActivityLogRow {
  id: number;
  user_id: number | null;
  email: string | null;
  full_name: string | null;
  user_role: string | null;
  activity_type: string;
  module: string | null;
  entity_label: string | null;
  entity_id: string | null;
  http_method: string | null;
  route: string | null;
  description: string | null;
  success: boolean;
  http_status: number | null;
  ip_address: string | null;
  ip_country: string | null;
  ip_region: string | null;
  ip_city: string | null;
  ip_isp: string | null;
  location_summary: string | null;
  user_agent: string | null;
  device_summary: string | null;
  browser: string | null;
  platform: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at: string;
}

export interface UserLoginLogRow {
  id: number;
  user_id: number | null;
  email: string | null;
  full_name: string | null;
  user_role: string | null;
  ip_address: string | null;
  ip_country?: string | null;
  ip_region?: string | null;
  ip_city?: string | null;
  ip_isp?: string | null;
  location_summary?: string | null;
  user_agent: string | null;
  device_summary: string | null;
  browser: string | null;
  platform: string | null;
  success: boolean;
  logged_in_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DailyActivitySummary {
  logins: number;
  creates: number;
  updates: number;
  deletes: number;
  posts: number;
  voids: number;
  other: number;
}

export interface DailyActivityPayload {
  date: string;
  user_id: number | null;
  email: string | null;
  summary: DailyActivitySummary;
  logins: UserLoginLogRow[];
  activities: UserActivityLogRow[];
}

export interface ActivityDetailResponse {
  activity: UserActivityLogRow;
  daily: DailyActivityPayload;
}

export const getUserActivityLogs = async (params?: {
  user_id?: number;
  email?: string;
  role?: string;
  activity_type?: string;
  module?: string;
  fromDate?: string;
  toDate?: string;
  success?: boolean;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<UserActivityLogRow>> => {
  const { data } = await api.get("/user-activity-logs", { params });
  return data;
};

export const getUserActivityDetail = async (id: number): Promise<ActivityDetailResponse> => {
  const { data } = await api.get(`/user-activity-logs/${id}`);
  return data;
};

export interface DailyOverviewUser {
  user_id: number | null;
  email: string | null;
  full_name: string | null;
  user_role: string | null;
  last_activity_at: string | null;
  last_ip: string | null;
  last_location: string | null;
  last_device: string | null;
  summary: DailyActivitySummary;
  activities: UserActivityLogRow[];
}

export interface DailyOverviewPayload {
  date: string;
  total: number;
  summary: DailyActivitySummary;
  users: DailyOverviewUser[];
  activities: UserActivityLogRow[];
}

export const getDailyActivityOverview = async (params: {
  date: string;
  user_id?: number;
  email?: string;
  role?: string;
  activity_type?: string;
}): Promise<DailyOverviewPayload> => {
  const { data } = await api.get("/user-activity-logs/daily-overview", { params });
  return data;
};

export const getUserDailyActivity = async (params: {
  date: string;
  user_id?: number;
  email?: string;
}): Promise<DailyActivityPayload> => {
  const { data } = await api.get("/user-activity-logs/daily", { params });
  return data;
};

// Legacy login-only endpoint (kept for compatibility)
export const getUserLoginLogs = async (params?: {
  email?: string;
  role?: string;
  fromDate?: string;
  toDate?: string;
  success?: boolean;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<UserLoginLogRow>> => {
  const { data } = await api.get("/user-login-logs", { params });
  return data;
};

export function activityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    login: "Login",
    login_failed: "Failed Login",
    login_blocked_ip: "Blocked IP Login",
    create: "Create",
    update: "Update",
    delete: "Delete",
    post: "Post",
    void: "Void",
    action: "Action",
  };
  return map[type] ?? type;
}

export function activityTypeColor(
  type: string
): "default" | "primary" | "success" | "warning" | "error" | "info" {
  if (type === "login") return "success";
  if (type === "login_failed" || type === "login_blocked_ip") return "error";
  if (type === "create" || type === "post") return "primary";
  if (type === "update") return "info";
  if (type === "delete" || type === "void") return "error";
  return "default";
}
