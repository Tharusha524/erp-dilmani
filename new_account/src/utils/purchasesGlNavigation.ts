export interface PurchasesGlJournalNavState {
  trans_no?: number | string | null;
  trans_type?: number | string | null;
  reference?: string | null;
  date?: string | null;
  orderNo?: number | string | null;
  purchaseOrderRef?: number | string | null;
  grnBatchId?: number | string | null;
  deliveryDate?: string | null;
}

export function purchasesGlJournalPath(state: PurchasesGlJournalNavState = {}): string {
  const params = new URLSearchParams();
  if (state.trans_no != null && state.trans_no !== "") {
    params.set("trans_no", String(state.trans_no));
  }
  if (state.trans_type != null && state.trans_type !== "") {
    params.set("trans_type", String(state.trans_type));
  }
  if (state.reference) {
    params.set("reference", String(state.reference));
  }
  if (state.date) {
    params.set("date", String(state.date));
  }
  const order = state.orderNo ?? state.purchaseOrderRef;
  if (order != null && order !== "") {
    params.set("orderNo", String(order));
  }
  if (state.grnBatchId != null && state.grnBatchId !== "") {
    params.set("grnBatchId", String(state.grnBatchId));
  }
  const qs = params.toString();
  return `/purchase/transactions/gl-journal-entries${qs ? `?${qs}` : ""}`;
}

export function readPurchasesGlJournalNav(
  searchParams: URLSearchParams,
  locationState?: Record<string, unknown> | null
): PurchasesGlJournalNavState {
  const state = locationState ?? {};
  const pickScalar = (key: string): string | number | undefined => {
    const fromState = state[key];
    if (fromState != null && fromState !== "") {
      if (typeof fromState === "number" || typeof fromState === "string") {
        return fromState;
      }
      return String(fromState);
    }
    const fromQuery = searchParams.get(key);
    return fromQuery != null && fromQuery !== "" ? fromQuery : undefined;
  };

  const pickString = (key: string): string | undefined => {
    const value = pickScalar(key);
    return value == null ? undefined : String(value);
  };

  return {
    trans_no: pickScalar("trans_no"),
    trans_type: pickScalar("trans_type"),
    reference: pickString("reference"),
    date: pickString("date") ?? pickString("invoiceDate") ?? pickString("deliveryDate"),
    orderNo: pickScalar("orderNo") ?? pickScalar("purchaseOrderRef"),
    purchaseOrderRef: pickScalar("purchaseOrderRef"),
    grnBatchId: pickScalar("grnBatchId"),
    deliveryDate: pickString("deliveryDate"),
  };
}
