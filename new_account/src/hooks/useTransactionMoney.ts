import { useCallback, useMemo } from "react";
import { useHomeCurrency } from "./useHomeCurrency";
import {
  formatTransactionAmount,
  formatTransactionMoney,
} from "../utils/transactionMoney";

/** Format amounts for a sales/purchase document in the party currency (or home currency). */
export function useTransactionMoney(currencyCode?: string | null) {
  const { code: homeCurrencyCode } = useHomeCurrency();
  const resolved = useMemo(
    () =>
      String(currencyCode ?? homeCurrencyCode ?? "LKR")
        .trim()
        .toUpperCase(),
    [currencyCode, homeCurrencyCode]
  );

  const formatMoney = useCallback(
    (value: number | string | null | undefined, decimals = 2) =>
      formatTransactionMoney(value, resolved, decimals),
    [resolved]
  );

  const formatAmount = useCallback(
    (value: number | string | null | undefined, decimals = 2) =>
      formatTransactionAmount(value, decimals),
    []
  );

  return { currencyCode: resolved, formatMoney, formatAmount };
}
