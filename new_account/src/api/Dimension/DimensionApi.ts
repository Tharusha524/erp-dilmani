import api from "../apiClient";

const BASE_URL = "/dimensions";

export interface DimensionRecord {
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

export interface DimensionPayload {
  reference: string;
  name: string;
  type: number;
  start_date?: string;
  date_required_by?: string;
  tag_id?: number | null;
  memo?: string;
  closed?: boolean;
}

export interface DimensionSearchFilters {
  reference?: string;
  type?: number | string;
  fromDate?: string;
  toDate?: string;
  onlyOpen?: boolean;
  onlyOverdue?: boolean;
  outstandingOnly?: boolean;
}

export const getDimensions = async (): Promise<DimensionRecord[]> => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const getDimension = async (id: number | string): Promise<DimensionRecord> => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const searchDimensions = async (
  filters: DimensionSearchFilters
): Promise<DimensionRecord[]> => {
  const response = await api.post(`${BASE_URL}/search`, filters);
  return response.data;
};

export const createDimension = async (payload: DimensionPayload) => {
  const response = await api.post(BASE_URL, payload);
  return response.data;
};

export const updateDimension = async (id: number | string, payload: Partial<DimensionPayload>) => {
  const response = await api.put(`${BASE_URL}/${id}`, payload);
  return response.data;
};

export const deleteDimension = async (id: number | string) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export interface DimensionGlBalanceLine {
  account: string;
  account_name: string;
  amount: number;
}

export interface DimensionGlBalanceResponse {
  total: number;
  lines: DimensionGlBalanceLine[];
  fromDate: string;
  toDate: string;
  fiscal_year_from: string;
}

export const fetchDimensionGlBalance = async (
  id: number | string,
  params?: { fromDate?: string; toDate?: string }
): Promise<DimensionGlBalanceResponse> => {
  const response = await api.get(`${BASE_URL}/${id}/gl-balance`, {
    params,
    skipErrorDialog: true,
  } as Parameters<typeof api.get>[1]);
  return response.data;
};

