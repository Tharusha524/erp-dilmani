import type { CustomerCreditSummary } from "../api/Customer/CustomerCreditApi";

/** FrontAccounting: ST_BANKDEPOSIT, ST_CUSTCREDIT, ST_CUSTPAYMENT */
export const CREDIT_REDUCING_TRANS_TYPES = new Set([2, 11, 12]);

/** FrontAccounting: ST_CUSTDELIVERY — excluded from customer balance */
export const EXCLUDED_BALANCE_TRANS_TYPES = new Set([13]);

export function debtorTransNetTotal(dt: {
  ov_amount?: number;
  ov_gst?: number;
  ov_freight?: number;
  ov_freight_tax?: number;
  ov_discount?: number;
}): number {
  return (
    Number(dt.ov_amount ?? 0) +
    Number(dt.ov_gst ?? 0) +
    Number(dt.ov_freight ?? 0) +
    Number(dt.ov_freight_tax ?? 0) +
    Number(dt.ov_discount ?? 0)
  );
}

export function debtorTransSignedBalance(
  dt: { trans_type?: number } & Parameters<typeof debtorTransNetTotal>[0] & {
      alloc?: number;
    }
): number {
  const transType = Number(dt.trans_type ?? 0);
  if (EXCLUDED_BALANCE_TRANS_TYPES.has(transType)) {
    return 0;
  }
  const net = debtorTransNetTotal(dt) - Number(dt.alloc ?? 0);
  const sign = CREDIT_REDUCING_TRANS_TYPES.has(transType) ? -1 : 1;
  return sign * net;
}

export function computeOutstandingFromDebtorTrans(
  debtorTrans: any[],
  debtorNo: string | number
): number {
  return (debtorTrans || [])
    .filter((dt) => String(dt.debtor_no) === String(debtorNo))
    .reduce((sum, dt) => sum + debtorTransSignedBalance(dt), 0);
}

export function resolveCustomerCreditLimit(customer: any): number {
  return Number(customer?.credit_limit ?? customer?.creditLimit ?? 0) || 0;
}

export function buildClientCreditSummary(
  customer: any,
  outstandingBalance: number
): CustomerCreditSummary {
  const creditLimit = resolveCustomerCreditLimit(customer);
  const hasLimit = creditLimit > 0.001;

  return {
    credit_limit: creditLimit,
    outstanding_balance: outstandingBalance,
    available_credit: hasLimit ? creditLimit - outstandingBalance : null,
    has_credit_limit: hasLimit,
  };
}

export function isCashSalePaymentTerm(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  const term = (paymentTerms || []).find(
    (pt) => String(pt.terms_indicator) === String(payment)
  );
  if (!term) {
    return false;
  }
  if (term.cash_sale) {
    return true;
  }
  const typeName = String(
    term?.payment_type?.name ?? term?.paymentType?.name ?? ""
  ).toLowerCase();
  if (typeName.includes("cash")) {
    return true;
  }
  if (Number(term.days_before_due) === -1) {
    return false;
  }
  if (Number(term.days_before_due) === 0 && !typeName.includes("prepay")) {
    return true;
  }
  const pt = term.payment_type;
  const typeId =
    typeof pt === "number" ? pt : pt?.id ?? pt?.payment_type ?? null;
  // Legacy: even-numbered Cash types in FA seed (2, 6, 10, …)
  const id = Number(typeId);
  return Number.isFinite(id) && id > 0 && id % 4 === 2;
}

export function formatCreditMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unlimited";
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function validateCustomerCreditForSale(params: {
  summary: CustomerCreditSummary | null | undefined;
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
  const available = Number(summary.available_credit ?? 0);
  if (total > available + 0.01) {
    return `Customer credit limit exceeded. Available credit: ${formatCreditMoney(
      Math.max(0, available)
    )}. This document: ${formatCreditMoney(total)}.`;
  }
  return null;
}
