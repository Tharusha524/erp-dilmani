import api, { type ApiRequestConfig } from "../apiClient";

export interface DashboardKpi {
  value: number;
  change: number;
}

export interface DashboardAlert {
  label: string;
  severity: "warning" | "info";
  type?: string;
}

export interface DashboardSummary {
  as_at: string;
  server_now_utc?: string;
  period: {
    mtd_start: string;
    mtd_end: string;
    fiscal_year_from?: string;
    fiscal_year_to?: string;
    fiscal_year_label?: string;
    fiscal_report_start?: string;
    fiscal_report_end?: string;
  };
  kpis: {
    sales_mtd: DashboardKpi;
    purchases_mtd: DashboardKpi;
    receivables: DashboardKpi;
    payables: DashboardKpi;
    inventory_value: DashboardKpi;
    bank_balance: DashboardKpi;
  };
  sales_vs_purchases: { name: string; sales: number; purchases: number }[];
  module_distribution: { name: string; value: number }[];
  cash_flow: { name: string; inflow: number; outflow: number }[];
  recent_activity: {
    id: string;
    type: string;
    ref: string;
    amount: number | null;
    status: string;
    time: string;
  }[];
  alerts: DashboardAlert[];
}

export const getDashboardAlerts = async (): Promise<DashboardAlert[]> => {
  const response = await api.get<{ alerts: DashboardAlert[] }>(
    "/dashboard/alerts",
    { skipErrorDialog: true } as ApiRequestConfig
  );
  return response.data?.alerts ?? [];
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>("/dashboard");
  const headerDate = response.headers?.date;
  const parsedHeaderDate = headerDate ? Date.parse(headerDate) : NaN;

  return {
    ...response.data,
    server_now_utc: Number.isFinite(parsedHeaderDate)
      ? new Date(parsedHeaderDate).toISOString()
      : response.data.server_now_utc,
  };
};

