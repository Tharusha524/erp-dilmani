/** Item dropdown label: CODE — Description (sales, purchase, inventory, FA) */

export type ItemLike = {
  stock_id?: string | number;
  id?: string | number;
  description?: string;
};

export function formatItemLabel(item: ItemLike): string {
  const code = String(item.stock_id ?? item.id ?? "").trim();
  const name = String(item.description ?? "").trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return name || code || "—";
}

export function findItemByStockId<T extends ItemLike>(
  items: T[],
  stockId: string | number | null | undefined
): T | undefined {
  if (stockId == null || stockId === "") {
    return undefined;
  }
  const id = String(stockId);
  return items.find((it) => String(it.stock_id ?? it.id ?? "") === id);
}
