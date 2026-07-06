export interface ItemCodePayload {
  item_code: string;
  stock_id: string;
  description: string;
  category_id: number;
  quantity: number;
  is_foreign: 0 | 1;
  inactive?: 0 | 1;
}

export type ItemCodePayloadInput = {
  item_code: string;
  stock_id?: string | number | null;
  description?: string | null;
  category_id?: string | number | null;
  quantity?: string | number | null;
  is_foreign?: boolean | number | null;
  inactive?: boolean | number | null;
};

export function resolveStockId(
  item: Record<string, unknown> | null | undefined
): string {
  if (!item) return "";
  const raw =
    item.stock_id ??
    item.stockId ??
    item.stock_master_id ??
    null;
  if (raw == null || String(raw).trim() === "") return "";
  return String(raw).trim();
}

/**
 * Normalizes form data to match ItemCodesRequest validation on the API.
 */
export function normalizeItemCodePayload(data: ItemCodePayloadInput): ItemCodePayload {
  const itemCode = String(data.item_code ?? "").trim();
  if (!itemCode) {
    throw new Error("Item code is required.");
  }

  const stockId =
    data.stock_id != null && String(data.stock_id).trim() !== ""
      ? String(data.stock_id).trim()
      : "";
  if (!stockId) {
    throw new Error(
      "Stock item is required. Select an inventory item before saving this code."
    );
  }

  const categoryId = parseInt(String(data.category_id ?? ""), 10);
  if (!Number.isFinite(categoryId) || categoryId < 1) {
    throw new Error("A valid category is required.");
  }

  const qty = parseInt(String(data.quantity ?? ""), 10);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new Error("Quantity must be a whole number of at least 1.");
  }

  return {
    item_code: itemCode.slice(0, 20),
    stock_id: stockId.slice(0, 20),
    description: String(data.description ?? "").trim().slice(0, 200),
    category_id: categoryId,
    quantity: qty,
    is_foreign: Number(data.is_foreign ?? 0) ? 1 : 0,
    ...(data.inactive != null ? { inactive: Number(data.inactive) ? 1 : 0 } : {}),
  };
}
