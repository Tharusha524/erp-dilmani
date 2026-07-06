import api from "../apiClient";

const BASE_URL = "/cost-centers";

export interface CostCenterRecord {
  id: number;
  reference: string;
  name: string;
  type: number;
  start_date?: string;
  date_required_by?: string;
  tag_id?: number | null;
  memo?: string;
  closed?: boolean;
  balance?: number;
  tag?: { id: number; tagName: string; tagDescription?: string };
}

export interface CostCenterPayload {
  reference: string;
  name: string;
  type: number;
  start_date?: string;
  date_required_by?: string;
  tag_id?: number | null;
  memo?: string;
  closed?: boolean;
}

export interface CostCenterSearchFilters {
  reference?: string;
  type?: number | string;
  fromDate?: string;
  toDate?: string;
  onlyOpen?: boolean;
  onlyOverdue?: boolean;
  outstandingOnly?: boolean;
}

export const getCostCenters = async (): Promise<CostCenterRecord[]> => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const getCostCenter = async (id: number | string): Promise<CostCenterRecord> => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const searchCostCenters = async (
  filters: CostCenterSearchFilters
): Promise<CostCenterRecord[]> => {
  const response = await api.post(`${BASE_URL}/search`, filters);
  return response.data;
};

export const createCostCenter = async (payload: CostCenterPayload) => {
  const response = await api.post(BASE_URL, payload);
  return response.data;
};

export const updateCostCenter = async (id: number | string, payload: Partial<CostCenterPayload>) => {
  const response = await api.put(`${BASE_URL}/${id}`, payload);
  return response.data;
};

export const deleteCostCenter = async (id: number | string) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export interface CostCenterGlBalanceLine {
  account: string;
  account_name: string;
  amount: number;
}

export interface CostCenterGlBalanceResponse {
  total: number;
  lines: CostCenterGlBalanceLine[];
  fromDate: string;
  toDate: string;
  fiscal_year_from: string;
}

export const fetchCostCenterGlBalance = async (
  id: number | string,
  params?: { fromDate?: string; toDate?: string }
): Promise<CostCenterGlBalanceResponse> => {
  const response = await api.get(`${BASE_URL}/${id}/gl-balance`, {
    params,
    skipErrorDialog: true,
  } as Parameters<typeof api.get>[1]);
  return response.data;
};

