import type { QueryClient } from "@tanstack/react-query";

/** Invalidate TB / BS / P&L after a transaction creates, updates, or deletes GL lines. */
export function invalidateFinancialReports(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["trialBalance"] });
  queryClient.invalidateQueries({ queryKey: ["balanceSheet"] });
  queryClient.invalidateQueries({ queryKey: ["profitAndLoss"] });
}
