/** Resolve payment term row from master list. */
export function findPaymentTerm(
  paymentTerms: any[],
  payment: string | number | null | undefined
): any | null {
  if (payment === null || payment === undefined || payment === "") {
    return null;
  }
  return (
    (paymentTerms || []).find(
      (pt) => String(pt.terms_indicator) === String(payment)
    ) ?? null
  );
}

export function paymentTermTypeId(term: any): number | null {
  if (!term) return null;
  const pt = term.payment_type ?? term.paymentType;
  if (pt == null) return null;
  if (typeof pt === "number" || typeof pt === "string") {
    const n = Number(pt);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = Number(pt.id ?? pt.payment_type ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function paymentTermTypeName(term: any): string {
  if (!term) return "";
  const pt = term.payment_type ?? term.paymentType;
  if (pt && typeof pt === "object" && pt.name) {
    return String(pt.name).toLowerCase();
  }
  return "";
}

/**
 * FrontAccounting payment type category from payment_types.id.
 * IDs repeat in groups of 4: prepay(1), cash(2), after-days(3), following-month(0).
 */
export function paymentTypeCategory(typeId: number | null | undefined): number | null {
  if (typeId == null || !Number.isFinite(Number(typeId))) return null;
  const id = Number(typeId);
  if (id <= 0) return null;
  return id % 4;
}

export function isPrepaymentPaymentType(typeId: number | null | undefined): boolean {
  return paymentTypeCategory(typeId) === 1;
}

export function isCashPaymentType(typeId: number | null | undefined): boolean {
  return paymentTypeCategory(typeId) === 2;
}

export function isAfterDaysPaymentType(typeId: number | null | undefined): boolean {
  return paymentTypeCategory(typeId) === 3;
}

export function isDayInFollowingMonthPaymentType(typeId: number | null | undefined): boolean {
  return paymentTypeCategory(typeId) === 0;
}

/** Credit terms that show delivery / quotation details (not cash or prepay). */
export function isCreditDeliveryPaymentTerm(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  const term = findPaymentTerm(paymentTerms, payment);
  if (!term) return false;

  const typeId = paymentTermTypeId(term);
  if (isAfterDaysPaymentType(typeId) || isDayInFollowingMonthPaymentType(typeId)) {
    return true;
  }

  const name = paymentTermTypeName(term);
  if (name.includes("after") && name.includes("day")) return true;
  if (name.includes("following month")) return true;
  if (name.includes("within") && name.includes("day")) return true;

  return false;
}

export function showQuotationDeliveryDetailsForPayment(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  return (
    !isCashPaymentTerm(paymentTerms, payment) &&
    !isPrepaymentPaymentTerm(paymentTerms, payment) &&
    isCreditDeliveryPaymentTerm(paymentTerms, payment)
  );
}

/** FrontAccounting prepayment term (days_before_due = -1 or Prepayment type). */
export function isPrepaymentPaymentTerm(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  const term = findPaymentTerm(paymentTerms, payment);
  if (!term) return false;
  if (Number(term.days_before_due) === -1) return true;
  if (isPrepaymentPaymentType(paymentTermTypeId(term))) return true;
  const name = paymentTermTypeName(term);
  if (name.includes("prepay")) return true;
  return false;
}

/** Cash sale term (Cash type / cash_sale flag / zero days non-prepay). */
export function isCashPaymentTerm(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  const term = findPaymentTerm(paymentTerms, payment);
  if (!term) return false;
  if (term.cash_sale) return true;
  if (isCashPaymentType(paymentTermTypeId(term))) return true;
  const name = paymentTermTypeName(term);
  if (name.includes("cash")) return true;
  if (
    Number(term.days_before_due) === 0 &&
    !isPrepaymentPaymentTerm(paymentTerms, payment) &&
    !isCreditDeliveryPaymentTerm(paymentTerms, payment)
  ) {
    return true;
  }
  return false;
}

/** Orders listed on Invoice Prepaid Orders / requiring prep_amount on save. */
export function requiresOrderPrepayment(
  paymentTerms: any[],
  payment: string | number | null | undefined
): boolean {
  return (
    isPrepaymentPaymentTerm(paymentTerms, payment) ||
    isCashPaymentTerm(paymentTerms, payment)
  );
}

export function salesOrderPrepAmount(
  paymentTerms: any[],
  payment: string | number | null | undefined,
  orderTotal: number
): number {
  if (!requiresOrderPrepayment(paymentTerms, payment)) {
    return 0;
  }
  const total = Number(orderTotal) || 0;
  return Math.round(total * 100) / 100;
}
