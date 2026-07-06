import api from "../apiClient";

const BASE = "/manufacturing/work-orders";

export interface WorkOrderEntryPayload {
  wo_ref: string;
  loc_code: string;
  units_reqd: number;
  stock_id: string;
  date?: string;
  type: number;
  required_by?: string;
  memo?: string;
  labour_cost?: number;
  labour_credit_account?: string;
  overhead_cost?: number;
  overhead_credit_account?: string;
}

export interface ManufacturingIssueLine {
  stock_id: string;
  quantity: number;
  unit_cost?: number;
}

export const postWorkOrderEntry = async (payload: WorkOrderEntryPayload) => {
  const response = await api.post(`${BASE}/entry`, payload);
  return response.data;
};

export const postWorkOrderRelease = async (
  workOrderId: number | string,
  payload: { released_date: string; memo?: string }
) => {
  const response = await api.post(`${BASE}/${workOrderId}/release`, payload);
  return response.data;
};

export const postWorkOrderIssue = async (payload: {
  workorder_id: number;
  reference?: string;
  issue_date: string;
  loc_code: string;
  work_centre?: number | null;
  memo?: string;
  return_to_inventory?: boolean;
  lines: ManufacturingIssueLine[];
}) => {
  const response = await api.post(`${BASE}/issue`, payload);
  return response.data;
};

export const postWorkOrderProduce = async (payload: {
  workorder_id: number;
  reference?: string;
  quantity: number;
  date: string;
  memo?: string;
  close?: boolean;
}) => {
  const response = await api.post(`${BASE}/produce`, payload);
  return response.data;
};

export const postWorkOrderCost = async (payload: {
  workorder_id: number;
  reference?: string;
  date: string;
  amount: number;
  cost_type?: number;
  credit_account: string;
  memo?: string;
}) => {
  const response = await api.post(`${BASE}/cost`, payload);
  return response.data;
};
