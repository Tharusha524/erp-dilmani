import api from "../apiClient";

export interface BudgetPeriodRow {
  tran_date: string;
  amount: number;
}

export const getBudgetTrans = async (params: {
  fiscal_year_id: number;
  account: string;
  cost_center_id?: number;
  cost_center2_id?: number;
}) => {
  const { data } = await api.get("/budget-trans", { params });
  return data as { tran_date: string; amount: number }[];
};

export const saveBudgetTrans = async (payload: {
  fiscal_year_id: number;
  account: string;
  cost_center_id?: number;
  cost_center2_id?: number;
  periods: BudgetPeriodRow[];
}) => {
  const { data } = await api.post("/budget-trans", payload);
  return data;
};

export const deleteBudgetTrans = async (params: {
  fiscal_year_id: number;
  account: string;
  cost_center_id?: number;
  cost_center2_id?: number;
}) => {
  const { data } = await api.delete("/budget-trans", { params });
  return data;
};

