import api from "../apiClient";

export interface SalesCreditNoteLine {
  stock_id: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  description?: string;
  src_id?: number;
}

export interface CreateSalesCreditNotePayload {
  debtor_no: number;
  branch_code: number;
  tran_date: string;
  order_type: number;
  ship_via?: number | null;
  freight_cost?: number;
  from_stk_loc?: string;
  write_off_account?: string | null;
  source_invoice_trans_no?: number | null;
  comments?: string;
  reference?: string;
  cost_center_id?: number;
  lines: SalesCreditNoteLine[];
}

export const createSalesCreditNote = async (payload: CreateSalesCreditNotePayload) => {
  const response = await api.post("/sales/credit-notes", payload);
  return response.data;
};

export const voidSalesCreditNote = async (transNo: number, memo?: string) => {
  const response = await api.post(`/sales/credit-notes/${transNo}/void`, { memo });
  return response.data;
};
