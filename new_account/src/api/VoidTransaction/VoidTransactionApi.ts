import api from "../apiClient";

export interface VoidTransactionOption {
  trans_type: number;
  trans_no: number;
  label: string;
  type_name?: string;
  reference: string;
  date?: string;
}

export const getVoidTransactionOptions = async (): Promise<VoidTransactionOption[]> => {
  const { data } = await api.get("/void-transactions");
  return data;
};

export const voidTransaction = async (payload: {
  trans_type: number;
  trans_no: number;
  voiding_date: string;
  memo?: string;
}) => {
  const { data } = await api.post("/void-transactions", payload);
  return data;
};

