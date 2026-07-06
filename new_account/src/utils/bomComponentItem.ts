import { getBomParentCode, normalizeBomList } from "../api/Bom/BomApi";

export const MB_MANUFACTURED = 1;
export const MB_PURCHASED = 2;
export const MB_SERVICE = 3;
export const MB_FIXED_ASSET = 4;

export function getItemStockId(item: unknown): string {
  if (!item || typeof item !== "object") {
    return "";
  }
  const row = item as Record<string, unknown>;
  return String(row.stock_id ?? row.id ?? row.stock_master_id ?? row.item_id ?? "").trim();
}

/** Stock IDs that already have at least one BOM line (valid sub-assemblies). */
export function buildBomParentStockIds(boms: unknown): Set<string> {
  const ids = new Set<string>();
  for (const bom of normalizeBomList(boms)) {
    const parent = getBomParentCode(bom);
    if (parent) {
      ids.add(parent);
    }
  }
  return ids;
}

/**
 * Items allowed as BOM components — matches backend BomRequest validation.
 * Purchased / Service, or Manufactured only when the item has its own BOM (sub-assembly).
 */
export function isBomComponentItem(
  item: unknown,
  parentStockId: string | null,
  bomParentStockIds: Set<string>
): boolean {
  const stockId = getItemStockId(item);
  if (!stockId) {
    return false;
  }
  if (parentStockId && stockId === String(parentStockId).trim()) {
    return false;
  }

  const row = item as Record<string, unknown>;
  if (Number(row.inactive) === 1) {
    return false;
  }

  const flag = Number(row.mb_flag ?? row.mbFlag ?? 0);
  if (flag === MB_FIXED_ASSET) {
    return false;
  }
  if (flag === MB_PURCHASED || flag === MB_SERVICE || flag === 0) {
    return true;
  }
  if (flag === MB_MANUFACTURED) {
    return bomParentStockIds.has(stockId);
  }

  return false;
}

/** Wider list for the picker — shows invalid rows greyed out with a reason. */
export function isBomComponentCandidate(
  item: unknown,
  parentStockId: string | null
): boolean {
  const stockId = getItemStockId(item);
  if (!stockId) {
    return false;
  }
  if (parentStockId && stockId === String(parentStockId).trim()) {
    return false;
  }

  const row = item as Record<string, unknown>;
  if (Number(row.inactive) === 1) {
    return false;
  }

  const flag = Number(row.mb_flag ?? row.mbFlag ?? 0);
  return flag !== MB_FIXED_ASSET;
}

export function itemMbFlagLabel(item: unknown): string {
  const row = item as Record<string, unknown>;
  const flag = Number(row.mb_flag ?? row.mbFlag ?? 0);
  if (flag === MB_MANUFACTURED) return "Manufactured";
  if (flag === MB_PURCHASED) return "Purchased";
  if (flag === MB_SERVICE) return "Service";
  if (flag === MB_FIXED_ASSET) return "Fixed Asset";
  return "Other";
}

export function getBomComponentBlockReason(
  item: unknown,
  parentStockId: string | null,
  bomParentStockIds: Set<string>
): string | null {
  if (isBomComponentItem(item, parentStockId, bomParentStockIds)) {
    return null;
  }
  const row = item as Record<string, unknown>;
  const flag = Number(row.mb_flag ?? row.mbFlag ?? 0);
  if (flag === MB_MANUFACTURED) {
    return "Manufactured — set Item Type to Purchased, or add a BOM for this item first";
  }
  if (flag === MB_FIXED_ASSET) {
    return "Fixed assets cannot be BOM components";
  }
  return "Cannot use as component";
}

export const BOM_COMPONENT_EMPTY_HINT =
  "No items in the system yet. Create Purchased or Service items in Items & Inventory → Maintenance → Items.";

export const BOM_COMPONENT_ALL_BLOCKED_HINT =
  "Items exist but none are valid BOM components. Change parts to Item Type Purchased (or Service), or build a sub-assembly BOM for Manufactured items.";

export const BOM_MANUFACTURED_WITHOUT_BOM_MESSAGE =
  "This item is Manufactured but has no BOM of its own. Set Item Type to Purchased in Items & Inventory, or add a BOM for this item first (sub-assembly).";

export function manufacturedWithoutBom(stockId: string, items: unknown[], bomParentStockIds: Set<string>): boolean {
  const item = (items as unknown[]).find((it) => getItemStockId(it) === stockId);
  if (!item) {
    return false;
  }
  const row = item as Record<string, unknown>;
  const flag = Number(row.mb_flag ?? row.mbFlag ?? 0);
  return flag === MB_MANUFACTURED && !bomParentStockIds.has(stockId);
}

export function extractBomApiError(err: unknown): string {
  const e = err as {
    message?: string;
    response?: { data?: { message?: string; errors?: Record<string, string | string[]> } };
  };
  const data = e?.response?.data;
  if (data?.errors) {
    for (const key of ["component", "parent", "loc_code", "work_centre", "quantity"]) {
      const val = data.errors[key];
      if (val) {
        return Array.isArray(val) ? val[0] : String(val);
      }
    }
  }
  if (data?.message) {
    return String(data.message);
  }
  return e?.message || "Failed to save bill of material";
}
