import api from "../apiClient";

const BASE = "/inventory";

export interface InventoryLinePayload {
  stock_id: string;
  quantity: number;
  standard_cost?: number;
}

export const postInventoryTransfer = async (payload: {
  from_loc_code: string;
  to_loc_code: string;
  trans_date: string;
  reference?: string;
  comments?: string;
  lines: InventoryLinePayload[];
}) => {
  const response = await api.post(`${BASE}/transfers`, payload);
  return response.data;
};

export const postInventoryAdjustment = async (payload: {
  loc_code: string;
  trans_date: string;
  reference?: string;
  comments?: string;
  lines: InventoryLinePayload[];
}) => {
  const response = await api.post(`${BASE}/adjustments`, payload);
  return response.data;
};

export const getInventoryTransfer = async (transNo: number | string) => {
  const response = await api.get(`${BASE}/transfers/${transNo}`);
  return response.data;
};

export const getInventoryAdjustment = async (transNo: number | string) => {
  const response = await api.get(`${BASE}/adjustments/${transNo}`);
  return response.data;
};
