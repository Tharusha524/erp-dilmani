import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useHomeCurrency } from "./useHomeCurrency";
import { formatTransactionMoney } from "../utils/transactionMoney";

interface GlReportMoneyContextValue {
  currencyCode: string;
  formatAmount: (
    value: number | string | null | undefined,
    decimals?: number
  ) => string;
  formatStatementAmount: (value: number | string | null | undefined) => string;
  amountColumnLabel: (label: string) => string;
}

const GlReportMoneyContext = createContext<GlReportMoneyContextValue | null>(
  null
);

export function GlReportMoneyProvider({ children }: { children: ReactNode }) {
  const { code, isLoading } = useHomeCurrency();
  const currencyCode = (code || "LKR").toUpperCase();

  const formatAmount = useCallback(
    (value: number | string | null | undefined, decimals = 2) =>
      formatTransactionMoney(value, currencyCode, decimals),
    [currencyCode]
  );

  const formatStatementAmount = useCallback(
    (value: number | string | null | undefined) => {
      const n = typeof value === "string" ? parseFloat(value) : Number(value);
      if (!Number.isFinite(n) || Math.abs(n) < 0.001) {
        return `${currencyCode} 0`;
      }
      const abs = Math.abs(Math.round(n)).toLocaleString("en-LK", {
        maximumFractionDigits: 0,
      });
      const body = n < 0 ? `-${abs}` : abs;
      return `${currencyCode} ${body}`;
    },
    [currencyCode]
  );

  const amountColumnLabel = useCallback(
    (label: string) => (isLoading ? label : `${label} (${currencyCode})`),
    [currencyCode, isLoading]
  );

  const value = useMemo(
    () => ({
      currencyCode,
      formatAmount,
      formatStatementAmount,
      amountColumnLabel,
    }),
    [currencyCode, formatAmount, formatStatementAmount, amountColumnLabel]
  );

  return (
    <GlReportMoneyContext.Provider value={value}>
      {children}
    </GlReportMoneyContext.Provider>
  );
}

export function useGlReportMoney(): GlReportMoneyContextValue {
  const ctx = useContext(GlReportMoneyContext);
  if (!ctx) {
    throw new Error(
      "useGlReportMoney must be used within GlReportMoneyProvider"
    );
  }
  return ctx;
}
