import type { SupplierCreditSummary } from "../api/Supplier/SupplierCreditApi";
import { formatCreditMoney } from "./customerCredit";

export { formatCreditMoney };

export function resolveSupplierCreditLimit(supplier: any): number {
  return (
    Number(
      supplier?.credit_limit ??
        supplier?.creditLimit ??
        supplier?.credit ??
        0
    ) || 0
  );
}

export function buildClientSupplierCreditSummary(
  supplier: any,
  outstandingBalance: number
): SupplierCreditSummary {
  const creditLimit = resolveSupplierCreditLimit(supplier);
  const hasLimit = creditLimit > 0.001;
  const available = hasLimit ? creditLimit - outstandingBalance : null;

  return {
    credit_limit: creditLimit,
    outstanding_balance: outstandingBalance,
    available_credit: available,
    current_credit: available,
    has_credit_limit: hasLimit,
  };
}

export function validateSupplierCreditForPurchase(params: {
  summary: SupplierCreditSummary | null | undefined;
  documentTotal: number;
  skipCreditCheck?: boolean;
}): string | null {
  const { summary, documentTotal, skipCreditCheck } = params;
  if (skipCreditCheck || !summary?.has_credit_limit) {
    return null;
  }
  const total = Number(documentTotal) || 0;
  if (total <= 0) {
    return null;
  }
  const available = Number(
    summary.current_credit ?? summary.available_credit ?? 0
  );
  if (total > available + 0.01) {
    return `Supplier credit limit exceeded. Current credit: ${formatCreditMoney(
      Math.max(0, available)
    )}. This document: ${formatCreditMoney(total)}.`;
  }
  return null;
}
