import api from "../apiClient";

export interface BankAccountBalance {
  bank_account_id: number;
  bank_account_name: string;
  account_gl_code: string;
  as_at: string;
  book_balance: number;
  ending_reconcile_balance: number;
  last_reconciled_date: string | null;
  gl_balance: number | null;
}

export interface BankBalancesResponse {
  as_at: string;
  total: number;
  accounts: Array<{
    id: number;
    bank_account_name: string;
    bank_name: string;
    bank_account_number: string;
    account_gl_code: string;
    bank_curr_code: string;
    book_balance: number;
    ending_reconcile_balance: number;
    last_reconciled_date: string | null;
  }>;
}

export const getBankAccountBalance = async (
  bankAccountId: string | number
): Promise<BankAccountBalance> => {
  const { data } = await api.get<BankAccountBalance>(
    `/bank-accounts/${bankAccountId}/balance`
  );
  return data;
};

export const getAllBankBalances = async (): Promise<BankBalancesResponse> => {
  const { data } = await api.get<BankBalancesResponse>("/bank-balances");
  return data;
};

