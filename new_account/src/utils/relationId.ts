/** API may return a FK scalar or an eager-loaded relation object (e.g. sales_type: { id: 14 }). */
export function relationId(value: unknown, ...keys: string[]): string {
  if (value == null || value === "") return "";
  if (typeof value === "number" || typeof value === "string") {
    const s = String(value);
    return s === "[object Object]" ? "" : s;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      const v = obj[key];
      if (v != null && typeof v !== "object") return String(v);
    }
  }
  return "";
}

export function customerSalesTypeId(customer: any): string {
  return relationId(customer?.sales_type, "id") || relationId(customer?.salesType, "id");
}

export function customerPaymentTermId(customer: any): string {
  return (
    relationId(customer?.payment_terms, "terms_indicator", "id") ||
    relationId(customer?.payment_term, "terms_indicator")
  );
}

export function customerCurrencyCode(customer: any): string {
  return String(
    customer?.curr_code ??
      customer?.currency ??
      customer?.currCode ??
      ""
  )
    .trim()
    .toUpperCase();
}

/** Currency shown on sales documents: customer currency, else company home currency. */
export function resolveTransactionCurrencyCode(
  customer: any,
  homeCurrencyCode?: string | null
): string {
  const fromCustomer = customerCurrencyCode(customer);
  if (fromCustomer) return fromCustomer;
  const home = String(homeCurrencyCode ?? "")
    .trim()
    .toUpperCase();
  return home || "LKR";
}

export function supplierCurrencyCode(supplier: any): string {
  return String(
    supplier?.curr_code ?? supplier?.currency ?? supplier?.currCode ?? ""
  )
    .trim()
    .toUpperCase();
}

/** Currency shown on purchase documents: supplier currency, else company home currency. */
export function resolveSupplierTransactionCurrencyCode(
  supplier: any,
  homeCurrencyCode?: string | null
): string {
  const fromSupplier = supplierCurrencyCode(supplier);
  if (fromSupplier) return fromSupplier;
  const home = String(homeCurrencyCode ?? "")
    .trim()
    .toUpperCase();
  return home || "LKR";
}

export function resolveSupplierId(supplier: any): string {
  const id =
    supplier?.id ??
    supplier?.supplier_id ??
    supplier?.supp_id ??
    supplier?.supplierId ??
    null;
  return id != null ? String(id) : "";
}
