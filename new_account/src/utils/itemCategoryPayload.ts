/**
 * Normalizes item_category payloads (FrontAccounting category GL defaults).
 */

import { resolveAccountCode, resolveCogsAccountCode } from "./stockMasterDefaults";

export function normalizeItemCategoryPayload(
  data: Record<string, unknown>,
  chartMasters: { account_code: string }[] = []
): Record<string, unknown> {
  const description = String(data.description ?? data.categoryName ?? "").trim();
  if (!description) throw new Error("Category name is required.");

  const dflt_tax_type = parseInt(String(data.dflt_tax_type ?? data.itemTaxType ?? ""), 10);
  const dflt_units = parseInt(String(data.dflt_units ?? data.unitOfMeasure ?? ""), 10);
  const dflt_mb_flag = parseInt(String(data.dflt_mb_flag ?? data.itemType ?? ""), 10);

  if (!Number.isFinite(dflt_tax_type)) throw new Error("Default tax type is required.");
  if (!Number.isFinite(dflt_units)) throw new Error("Default unit of measure is required.");
  if (!Number.isFinite(dflt_mb_flag)) throw new Error("Default item type is required.");

  const sales = resolveAccountCode(
    chartMasters,
    String(data.dflt_sales_act ?? data.salesAccount ?? ""),
    ["4010", "2000"]
  );
  const inventory = resolveAccountCode(
    chartMasters,
    String(data.dflt_inventory_act ?? data.inventoryAccount ?? ""),
    ["1510", "1100"]
  );
  const cogs = resolveCogsAccountCode(
    chartMasters,
    String(data.dflt_cogs_act ?? data.cogsAccount ?? "")
  );
  const adjustment = resolveAccountCode(
    chartMasters,
    String(data.dflt_adjustment_act ?? data.inventoryAdjustmentAccount ?? ""),
    ["5040", "2214"]
  );
  const wip = resolveAccountCode(
    chartMasters,
    String(data.dflt_wip_act ?? data.itemAssemblyCostAccount ?? ""),
    ["2200", "1530", inventory]
  );

  return {
    description,
    dflt_tax_type,
    dflt_units,
    dflt_mb_flag,
    dflt_sales_act: sales,
    dflt_inventory_act: inventory,
    dflt_cogs_act: cogs,
    dflt_adjustment_act: adjustment,
    dflt_wip_act: wip,
    dflt_dim1: data.dflt_dim1 ?? null,
    dflt_dim2: data.dflt_dim2 ?? null,
    inactive: Number(data.inactive ?? 0) ? 1 : 0,
    dflt_no_sale: Number(data.dflt_no_sale ?? data.excludeFromSales ?? 0) ? 1 : 0,
    dflt_no_purchase: Number(data.dflt_no_purchase ?? data.excludeFromPurchases ?? 0) ? 1 : 0,
  };
}
