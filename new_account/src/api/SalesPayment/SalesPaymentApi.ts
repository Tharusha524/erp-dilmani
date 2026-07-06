import api from "../apiClient";

export interface CustomerPaymentAllocation {
  trans_no_to: number;
  trans_type_to: number;
  amt: number;
}

export interface CreateCustomerPaymentPayload {
  debtor_no: number;
  branch_code: number;
  tran_date: string;
  bank_account_id: number;
  amount: number;
  discount?: number;
  bank_charge?: number;
  reference?: string;
  comments?: string;
  dimension_id?: number;
  allocations?: CustomerPaymentAllocation[];
}

export const createCustomerPayment = async (payload: CreateCustomerPaymentPayload) => {
  const response = await api.post("/sales/payments", payload);
  return response.data;
};

export const voidCustomerPayment = async (transNo: number, memo?: string) => {
  const response = await api.post(`/sales/payments/${transNo}/void`, { memo });
  return response.data;
};
