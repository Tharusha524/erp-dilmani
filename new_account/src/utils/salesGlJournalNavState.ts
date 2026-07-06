/** Navigation state for Sales → GL Journal Entries (must include trans_type when trans_no is reused). */
export type SalesGlJournalNavState = {
  trans_no?: number | string;
  transNo?: number | string;
  trans_type?: number;
  reference?: string;
  date?: string;
  orderNo?: number | string;
};

export function buildSalesGlJournalNavState(
  input: Record<string, unknown> | undefined,
  defaultTransType?: number
): SalesGlJournalNavState {
  const transNo = input?.trans_no ?? input?.transNo;
  const rawType = input?.trans_type ?? defaultTransType;
  const transType =
    rawType != null && rawType !== "" ? Number(rawType) : defaultTransType;

  return {
    trans_no: transNo as number | string | undefined,
    transNo: transNo as number | string | undefined,
    trans_type: transType,
    reference: input?.reference ? String(input.reference) : undefined,
    date: String(
      input?.date ?? input?.depositDate ?? input?.creditNoteDate ?? ""
    ).split("T")[0] || undefined,
    orderNo: input?.orderNo as number | string | undefined,
  };
}

/** Customer credit note (debtor_trans type 11). */
export function creditNoteGlNavState(
  input: Record<string, unknown> | undefined
): SalesGlJournalNavState {
  return buildSalesGlJournalNavState(input, 11);
}

/** Customer payment (debtor_trans type 12). */
export function customerPaymentGlNavState(
  input: Record<string, unknown> | undefined
): SalesGlJournalNavState {
  return buildSalesGlJournalNavState(input, 12);
}

/** Delivery note (debtor_trans type 13). */
export function deliveryGlNavState(
  input: Record<string, unknown> | undefined
): SalesGlJournalNavState {
  return buildSalesGlJournalNavState(
    {
      ...input,
      deliveryDate: input?.date ?? input?.dispatchDate,
    },
    13
  );
}
