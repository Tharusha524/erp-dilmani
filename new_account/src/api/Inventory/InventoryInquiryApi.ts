import api from "../apiClient";

export interface InventoryItemMovementRow {
  trans_id: number;
  type: number;
  type_name: string;
  trans_no: number;
  reference: string;
  loc_code: string;
  location_name: string;
  tran_date: string;
  detail: string;
  quantity_in: number;
  quantity_out: number;
  quantity_on_hand: number;
}

export interface InventoryItemMovementsResult {
  qoh_before: number;
  qoh_after: number;
  rows: InventoryItemMovementRow[];
}

export interface InventoryItemStatusRow {
  loc_code: string;
  location: string;
  quantity_on_hand: number;
  reorder_level: number;
  demand: number;
  available: number;
  on_order: number;
}

export const getInventoryItemMovements = async (params: {
  stock_id: string;
  loc_code?: string;
  from_date: string;
  to_date: string;
}): Promise<InventoryItemMovementsResult> => {
  const response = await api.get("/inventory/inquiries/item-movements", { params });
  return response.data;
};

export const getInventoryItemStatus = async (
  stockId: string
): Promise<InventoryItemStatusRow[]> => {
  const response = await api.get(`/inventory/inquiries/item-status/${encodeURIComponent(stockId)}`);
  return response.data;
};
