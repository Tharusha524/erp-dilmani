import api from "../apiClient";

const API_URL = "/internal-service-invoices";

export interface InternalServiceInvoiceLinePayload {
  stock_id: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  description?: string;
}

export interface InternalServiceInvoicePayload {
  debtor_no?: number | null;
  branch_code?: number | null;
  tran_date: string;
  due_date?: string;
  order_type?: number | null;
  ship_via?: number | null;
  payment_terms?: number | null;
  freight_cost?: number;
  from_stk_loc?: string;
  customer_ref?: string;
  cost_center_id?: number | null;
  delivery_address?: string;
  deliver_to?: string;
  comments?: string;
  reference?: string;
  cash_sale?: boolean;
  bank_account_id?: number | null;
  advance_amount?: number;
  lines: InternalServiceInvoiceLinePayload[];
}

/**
 * Saves an Internal Service Invoice into its own dedicated tables
 * (internal_service_invoices / internal_service_invoice_lines) — this never
 * touches debtor_trans/stock_moves/gl_trans, so it has no effect on customer
 * balances, stock quantities, or GL/reports elsewhere in the system.
 */
export const createInternalServiceInvoice = async (payload: InternalServiceInvoicePayload) => {
  const response = await api.post(API_URL, payload);
  return response.data;
};

export const getInternalServiceInvoices = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const getInternalServiceInvoice = async (id: number | string) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};
