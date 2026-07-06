import api from "../apiClient";

export interface GlTransByTransactionParams {
  trans_no?: number | string;
  trans_type?: number | string;
  reference?: string;
  order_no?: number | string;
  purch_order_no?: number | string;
  module?: "sales" | "purchases" | "manufacturing" | "fixed_assets" | "banking" | "inventory";
}

export interface GlTransRow {
  id: string | number;
  trans_type: string | number;
  type_no?: number | null;
  type_label?: string;
  reference?: string;
  date?: string;
  account_code?: string;
  account_name?: string;
  account_type?: number | string;
  debit?: number | string;
  credit?: number | string;
  memo?: string;
}

export async function getGlTransByTransaction(
  params: GlTransByTransactionParams
): Promise<GlTransRow[]> {
  const response = await api.post("/gl-trans/by-transaction", params);
  return Array.isArray(response.data) ? response.data : [];
}
