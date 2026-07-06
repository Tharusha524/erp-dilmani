import api from "../apiClient";

export interface CustomerCreditSummary {
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number | null;
  has_credit_limit: boolean;
}

export const getCustomerCreditSummary = async (
  debtorNo: string | number
): Promise<CustomerCreditSummary> => {
  const response = await api.get(`/debtors-master/${debtorNo}/credit-summary`);
  return response.data;
};
