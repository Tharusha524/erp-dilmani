import api from "../apiClient";

export interface DispatchSalesDeliveryLine {
  sales_order_detail_id: number;
  quantity: number;
}

export interface DispatchSalesDeliveryPayload {
  order_no: number;
  tran_date: string;
  due_date?: string;
  ship_via?: number | null;
  freight_cost?: number;
  cost_center_id?: number;
  cost_center2_id?: number;
  comments?: string;
  close_order?: boolean;
  reference?: string;
  from_stk_loc?: string;
  lines: DispatchSalesDeliveryLine[];
}

export interface DirectSalesDeliveryLine {
  stock_id: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  description?: string;
}

export interface DirectSalesDeliveryPayload {
  debtor_no: number;
  branch_code: number;
  tran_date: string;
  due_date?: string;
  order_type: number;
  ship_via?: number | null;
  payment_terms?: number | null;
  freight_cost?: number;
  from_stk_loc: string;
  cost_center_id?: number;
  cost_center2_id?: number;
  comments?: string;
  reference?: string;
  customer_ref?: string;
  delivery_address?: string;
  deliver_to?: string;
  lines: DirectSalesDeliveryLine[];
}

export const dispatchSalesDelivery = async (payload: DispatchSalesDeliveryPayload) => {
  const response = await api.post("/sales/delivery/dispatch", payload);
  return response.data;
};

export const directSalesDelivery = async (payload: DirectSalesDeliveryPayload) => {
  const response = await api.post("/sales/delivery/direct", payload);
  return response.data;
};

export const voidSalesDelivery = async (transNo: number, memo?: string) => {
  const response = await api.post(`/sales/delivery/${transNo}/void`, { memo });
  return response.data;
};
