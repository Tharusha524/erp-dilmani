import { useQuery } from "@tanstack/react-query";
import { getAllBankBalances } from "../api/BankBalance/BankBalanceApi";

export default function useAllBankBalances(asAt?: string) {
  return useQuery({
    queryKey: ["bank-balances-all", asAt ?? ""],
    queryFn: () => getAllBankBalances(),
    staleTime: 30_000,
  });
}
