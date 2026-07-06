import api from "../apiClient";

export interface InvoiceFromDeliveryLine {
  delivery_detail_id: number;
  quantity: number;
}

export interface InvoiceFromDeliveryPayload {
  delivery_trans_no: number;
  tran_date: string;
  due_date?: string;
  ship_via?: number | null;
  freight_cost?: number;
  payment_terms?: number | null;
  comments?: string;
  reference?: string;
  lines: InvoiceFromDeliveryLine[];
}

export interface DirectSalesInvoiceLine {
  stock_id: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  description?: string;
}

export interface DirectSalesInvoicePayload {
  debtor_no: number;
  branch_code: number;
  tran_date: string;
  due_date?: string;
  order_type: number;
  ship_via?: number | null;
  payment_terms?: number | null;
  freight_cost?: number;
  from_stk_loc?: string;
  dimension_id?: number;
  dimension2_id?: number;
  comments?: string;
  reference?: string;
  customer_ref?: string;
  delivery_address?: string;
  deliver_to?: string;
  cash_sale?: boolean;
  bank_account_id?: number | null;
  lines: DirectSalesInvoiceLine[];
}

export const invoiceFromDelivery = async (payload: InvoiceFromDeliveryPayload) => {
  const response = await api.post("/sales/invoice/from-delivery", payload);
  return response.data;
};

export const directSalesInvoice = async (payload: DirectSalesInvoicePayload) => {
  const response = await api.post("/sales/invoice/direct", payload);
  return response.data;
};

export const voidSalesInvoice = async (transNo: number, memo?: string) => {
  const response = await api.post(`/sales/invoice/${transNo}/void`, { memo });
  return response.data;
};
