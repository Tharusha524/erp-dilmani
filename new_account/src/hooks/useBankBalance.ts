import { useQuery } from "@tanstack/react-query";
import { getBankAccountBalance } from "../api/BankBalance/BankBalanceApi";

export default function useBankBalance(
  bankAccountId: string | number | null | undefined
) {
  const id = bankAccountId ? String(bankAccountId) : "";
  const enabled = Boolean(id && id !== "0");

  return useQuery({
    queryKey: ["bank-balance", id],
    queryFn: () => getBankAccountBalance(id),
    enabled,
    staleTime: 30_000,
  });
}
