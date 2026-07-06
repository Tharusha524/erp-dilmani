/** GL account helpers for stock_master (inventory item) create/update — FrontAccounting-style category defaults */

export type ItemCategoryGlDefaults = {
  salesAccount?: string;
  cogsAccount?: string;
  inventoryAccount?: string;
  inventoryAdjustmentAccount?: string;
  wipAccount?: string;
  itemTaxType?: string;
  unitOfMeasure?: string;
  itemType?: string;
};

export function glAccountsFromCategory(category: Record<string, unknown> | undefined): ItemCategoryGlDefaults {
  if (!category) return {};
  return {
    salesAccount: String(category.dflt_sales_act ?? ""),
    cogsAccount: String(category.dflt_cogs_act ?? ""),
    inventoryAccount: String(category.dflt_inventory_act ?? ""),
    inventoryAdjustmentAccount: String(category.dflt_adjustment_act ?? ""),
    wipAccount: String(category.dflt_wip_act ?? ""),
    itemTaxType:
      category.dflt_tax_type != null ? String(category.dflt_tax_type) : undefined,
    unitOfMeasure: category.dflt_units != null ? String(category.dflt_units) : undefined,
    itemType: category.dflt_mb_flag != null ? String(category.dflt_mb_flag) : undefined,
  };
}

/** Pick an account that exists in chart_master, trying preferred codes in order */
export function resolveAccountCode(
  chartMasters: { account_code: string; account_name?: string }[],
  current: string,
  fallbacks: (string | undefined | null)[]
): string {
  const candidates = [current, ...fallbacks].filter(
    (c): c is string => !!c && String(c).trim() !== ""
  );
  for (const code of candidates) {
    if (chartMasters.some((a) => a.account_code === code)) return code;
  }
  return chartMasters[0]?.account_code ?? current ?? "";
}

const COGS_NAME_PATTERNS = [/cost of goods/i, /\bcogs\b/i, /^purchases?$/i];

/** COGS account — never fall back to sales commission or generic sales accounts */
export function resolveCogsAccountCode(
  chartMasters: { account_code: string; account_name?: string }[],
  current: string,
  fallbacks: (string | undefined | null)[] = []
): string {
  const fromCodes = resolveAccountCode(chartMasters, current, ["5010", "3010", ...fallbacks]);
  const picked = chartMasters.find((a) => a.account_code === fromCodes);
  if (picked && !/commission/i.test(picked.account_name ?? "")) {
    return fromCodes;
  }
  for (const pattern of COGS_NAME_PATTERNS) {
    const found = chartMasters.find((a) => pattern.test(a.account_name ?? ""));
    if (found && !/commission/i.test(found.account_name ?? "")) {
      return found.account_code;
    }
  }
  return fromCodes;
}

export type ItemGlFormAccounts = {
  salesAccount: string;
  inventoryAccount: string;
  cogsAccount: string;
  inventoryAdjustmentAccount: string;
  wipAccount: string;
};

export function resolveItemGlAccounts(
  form: ItemGlFormAccounts,
  chartMasters: { account_code: string }[],
  category?: Record<string, unknown>
): ItemGlFormAccounts {
  const cat = glAccountsFromCategory(category);
  return {
    salesAccount: resolveAccountCode(chartMasters, form.salesAccount, [
      cat.salesAccount,
      "4010",
      "2000",
    ]),
    inventoryAccount: resolveAccountCode(chartMasters, form.inventoryAccount, [
      cat.inventoryAccount,
      "1510",
      "1100",
    ]),
    cogsAccount: resolveCogsAccountCode(chartMasters, form.cogsAccount, [
      cat.cogsAccount,
    ]),
    inventoryAdjustmentAccount: resolveAccountCode(chartMasters, form.inventoryAdjustmentAccount, [
      cat.inventoryAdjustmentAccount,
      "5040",
      "2214",
    ]),
    wipAccount: resolveAccountCode(chartMasters, form.wipAccount, [
      cat.wipAccount,
      "2200",
      "1530",
      form.inventoryAccount,
      cat.inventoryAccount,
      form.cogsAccount,
    ]),
  };
}
