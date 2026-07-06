import api from "../apiClient";

export const postFaPurchase = async (payload: {
  supplier_id: number;
  loc_code: string;
  reference?: string;
  supp_reference?: string;
  trans_date?: string;
  due_date?: string;
  lines: { stock_id: string; quantity: number; price: number }[];
}) => {
  const { data } = await api.post("/fixed-assets/purchase", payload);
  return data;
};

export const postFaOpeningBalance = async (payload: {
  loc_code: string;
  trans_date?: string;
  reference?: string;
  lines: { stock_id: string; quantity: number }[];
}) => {
  const { data } = await api.post("/fixed-assets/opening-balance", payload);
  return data;
};

export const postFaTransfer = async (payload: {
  from_loc_code: string;
  to_loc_code: string;
  trans_date: string;
  reference?: string;
  lines: { stock_id: string; quantity: number }[];
}) => {
  const { data } = await api.post("/fixed-assets/transfer", payload);
  return data;
};

export const postFaDisposal = async (payload: {
  loc_code: string;
  trans_date: string;
  reference?: string;
  lines: { stock_id: string; quantity: number }[];
}) => {
  const { data } = await api.post("/fixed-assets/disposal", payload);
  return data;
};

export const postFaSale = async (payload: {
  debtor_no: number;
  branch_code?: number;
  loc_code?: string;
  reference?: string;
  invoice_reference?: string;
  tran_date?: string;
  due_date?: string;
  cost_center_id?: number;
  lines: { stock_id: string; quantity: number; price: number; loc_code?: string; description?: string }[];
}) => {
  const { data } = await api.post("/fixed-assets/sale", payload);
  return data;
};
