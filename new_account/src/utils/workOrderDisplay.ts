/** Resolve display label for a work order finished item (FA: stock_master.description). */
export function resolveWorkOrderItemLabel(workOrder: Record<string, unknown>, items: unknown[] = []): string {
  const stock = workOrder.stock as Record<string, unknown> | undefined;
  const fromRelation = String(stock?.description ?? "").trim();
  if (fromRelation) {
    return fromRelation;
  }

  const fromApi = String(workOrder.item_description ?? "").trim();
  if (fromApi) {
    return fromApi;
  }

  const stockId = String(workOrder.stock_id ?? "").trim();
  if (!stockId) {
    return "";
  }

  const item = (items as Record<string, unknown>[]).find(
    (it) => String(it.stock_id ?? it.id ?? "") === stockId
  );

  if (item) {
    const name = String(item.description ?? item.item_name ?? item.name ?? "").trim();
    if (name) {
      return name;
    }
  }

  return stockId;
}

export function resolveWorkOrderLocationLabel(
  workOrder: Record<string, unknown>,
  locations: unknown[] = []
): string {
  const fromApi = String(workOrder.location_name ?? "").trim();
  if (fromApi) {
    return fromApi;
  }

  const locCode = String(workOrder.loc_code ?? "").trim();
  if (!locCode) {
    return "";
  }

  const loc = (locations as Record<string, unknown>[]).find(
    (l) => String(l.loc_code ?? "") === locCode
  );

  return String(loc?.location_name ?? locCode).trim();
}
