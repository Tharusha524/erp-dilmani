import api from "../apiClient";

export interface SupplierCreditSummary {
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number | null;
  current_credit: number | null;
  has_credit_limit: boolean;
}

export const getSupplierCreditSummary = async (
  supplierId: string | number
): Promise<SupplierCreditSummary> => {
  const response = await api.get(`/suppliers/${supplierId}/credit-summary`);
  return response.data;
};
