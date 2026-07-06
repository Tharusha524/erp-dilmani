/**
 * Normalizes stock_master (inventory item) payloads for Laravel StockMasterRequest.
 * FrontAccounting: GL defaults come from item category (dflt_*_act).
 */

import { resolveItemGlAccounts, type ItemGlFormAccounts } from "./stockMasterDefaults";

export type StockMasterPayloadInput = Record<string, unknown>;

const DEFAULT_DEPR_DATE = "2020-01-01";

export function normalizeStockMasterPayload(
  data: StockMasterPayloadInput,
  chartMasters: { account_code: string }[] = [],
  category?: Record<string, unknown>
): Record<string, unknown> {
  const stockId = String(data.stock_id ?? data.itemCode ?? "").trim();
  if (!stockId) throw new Error("Item code (stock_id) is required.");

  const gl = resolveItemGlAccounts(
    {
      salesAccount: String(data.sales_account ?? data.salesAccount ?? ""),
      inventoryAccount: String(data.inventory_account ?? data.inventoryAccount ?? ""),
      cogsAccount: String(data.cogs_account ?? data.cogsAccount ?? ""),
      inventoryAdjustmentAccount: String(
        data.adjustment_account ?? data.inventoryAdjustmentAccount ?? ""
      ),
      wipAccount: String(data.wip_account ?? data.wipAccount ?? ""),
    },
    chartMasters,
    category
  );

  const categoryId = parseInt(String(data.category_id ?? data.category ?? ""), 10);
  const taxTypeId = parseInt(String(data.tax_type_id ?? data.itemTaxType ?? ""), 10);
  const units = parseInt(String(data.units ?? data.unitOfMeasure ?? ""), 10);
  const mbFlag = parseInt(String(data.mb_flag ?? data.itemType ?? ""), 10);

  if (!Number.isFinite(categoryId)) throw new Error("Category is required.");
  if (!Number.isFinite(taxTypeId)) throw new Error("Item tax type is required.");
  if (!Number.isFinite(units)) throw new Error("Unit of measure is required.");
  if (!Number.isFinite(mbFlag)) throw new Error("Item type is required.");

  return {
    stock_id: stockId,
    category_id: categoryId,
    tax_type_id: taxTypeId,
    description: String(data.description ?? data.itemName ?? "").trim(),
    long_description: String(data.long_description ?? data.description ?? "").trim(),
    units,
    mb_flag: mbFlag,
    sales_account: gl.salesAccount,
    inventory_account: gl.inventoryAccount,
    cogs_account: gl.cogsAccount,
    adjustment_account: gl.inventoryAdjustmentAccount,
    wip_account: gl.wipAccount,
    cost_center_id: data.cost_center_id ?? null,
    cost_center2_id: data.cost_center2_id ?? null,
    purchase_cost: Number(data.purchase_cost ?? 0),
    material_cost: Number(data.material_cost ?? 0),
    labour_cost: Number(data.labour_cost ?? 0),
    overhead_cost: Number(data.overhead_cost ?? 0),
    inactive: Number(data.inactive ?? 0) ? 1 : 0,
    no_sale: Number(data.no_sale ?? data.excludedFromSales ?? 0) ? 1 : 0,
    no_purchase: Number(data.no_purchase ?? data.excludedFromPurchases ?? 0) ? 1 : 0,
    editable: Number(data.editable ?? data.editableDescription ?? 0) ? 1 : 0,
    depreciation_method: data.depreciation_method ?? null,
    depreciation_rate: Number(data.depreciation_rate ?? 0),
    depreciation_factor: Number(data.depreciation_factor ?? 0),
    depreciation_start: String(data.depreciation_start ?? DEFAULT_DEPR_DATE),
    depreciation_date: String(data.depreciation_date ?? data.depreciation_start ?? DEFAULT_DEPR_DATE),
    fa_class_id: data.fa_class_id ?? null,
  };
}
