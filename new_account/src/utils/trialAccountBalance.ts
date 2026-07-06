/**
 * Mirrors backend ChartAccountMetadata + TrialAccountBalance.
 * Hierarchy: GL Account Class (chart_class) → GL Account Group (chart_types) → GL Account.
 */

export const DEBIT_NORMAL_TYPES = [1, 2, 3, 10, 11, 12] as const;
export const CREDIT_NORMAL_TYPES = [4, 5, 6, 7, 8, 9] as const;
export const BALANCE_SHEET_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;

export type BalanceSheetSection =
  | "capital_assets"
  | "current_assets"
  | "long_term_liabilities"
  | "current_liabilities"
  | "share_capital"
  | "retained_earnings";

export interface ChartGroupMeta {
  id: number;
  name: string;
  classId: string;
  className: string;
  classCtype: number;
}

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

/** Build group metadata from GL Account Groups + GL Account Classes setup screens. */
export function buildChartGroupMetaMap(
  chartTypes: Array<{ id?: string | number; name?: string; class_id?: string | number }>,
  chartClasses: Array<{ cid?: string | number; id?: string | number; class_name?: string; name?: string; ctype?: number }>
): Map<number, ChartGroupMeta> {
  const classById = new Map<string, { className: string; classCtype: number }>();
  chartClasses.forEach((cc) => {
    const id = normalizeId(cc.cid ?? cc.id);
    if (!id) return;
    classById.set(id, {
      className: String(cc.class_name ?? cc.name ?? ""),
      classCtype: Number(cc.ctype) || 0,
    });
  });

  const map = new Map<number, ChartGroupMeta>();
  chartTypes.forEach((ct) => {
    const id = Number(ct.id);
    if (!id) return;
    const classId = normalizeId(ct.class_id);
    const cls = classById.get(classId);
    map.set(id, {
      id,
      name: String(ct.name ?? ""),
      classId,
      className: cls?.className ?? "",
      classCtype: cls?.classCtype ?? 0,
    });
  });

  return map;
}

function metaFor(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): ChartGroupMeta | undefined {
  return metaMap?.get(accountType);
}

/** FA ctype: 1 & 6 debit-normal; 2 & 4 credit-normal. */
export function isDebitNormal(accountType: number, metaMap?: Map<number, ChartGroupMeta>): boolean {
  const meta = metaFor(accountType, metaMap);
  if (meta?.classCtype) {
    return meta.classCtype === 1 || meta.classCtype === 6;
  }
  return DEBIT_NORMAL_TYPES.includes(accountType as (typeof DEBIT_NORMAL_TYPES)[number]);
}

export function isCreditNormal(accountType: number, metaMap?: Map<number, ChartGroupMeta>): boolean {
  return !isDebitNormal(accountType, metaMap);
}

/** Balance sheet = Assets class (1) + Liabilities class (2). */
export function isBalanceSheetAccount(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  const meta = metaFor(accountType, metaMap);
  if (meta?.classId) {
    return meta.classId === "1" || meta.classId === "2";
  }
  return BALANCE_SHEET_TYPES.includes(accountType as (typeof BALANCE_SHEET_TYPES)[number]);
}

export function isProfitAndLossAccount(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  const meta = metaFor(accountType, metaMap);
  if (meta?.classCtype === 4 || meta?.classCtype === 6) {
    return true;
  }
  if (meta?.classId) {
    return meta.classId === "3" || meta.classId === "4" || meta.classId === "5";
  }
  return accountType >= 7 && accountType <= 12;
}

export function isProfitAndLossIncomeAccount(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  const meta = metaFor(accountType, metaMap);
  if (meta?.classCtype === 4 || meta?.classId === "3") {
    return true;
  }
  return accountType === 7 || accountType === 8;
}

export function isProfitAndLossCostAccount(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  return isProfitAndLossAccount(accountType, metaMap) && !isProfitAndLossIncomeAccount(accountType, metaMap);
}

/** INCOME chart class (class_id 3 / ctype 4). */
export function isIncomeClassRow(
  row: { accountType?: number; classId?: string },
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  const classId = String(row.classId ?? "").trim();
  if (classId === "3") return true;
  if (classId === "4" || classId === "5") return false;
  const accountType = Number(row.accountType ?? 0);
  const meta = metaFor(accountType, metaMap);
  if (meta?.classCtype === 4 || meta?.classId === "3") return true;
  return false;
}

/** COSTS / expense chart class (class_id 4 or 5 / ctype 6). */
export function isCostClassRow(
  row: { accountType?: number; classId?: string },
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  const classId = String(row.classId ?? "").trim();
  if (classId === "4" || classId === "5") return true;
  if (classId === "3") return false;
  const accountType = Number(row.accountType ?? 0);
  const meta = metaFor(accountType, metaMap);
  if (meta?.classCtype === 6 || meta?.classId === "4" || meta?.classId === "5") return true;
  return false;
}

export function signedBalance(
  debit: number,
  credit: number,
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): number {
  const raw = debit - credit;
  return isCreditNormal(accountType, metaMap) ? -raw : raw;
}

export function balanceSheetAmount(
  glDebitMinusCredit: number,
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): number {
  if (!isBalanceSheetAccount(accountType, metaMap)) {
    return 0;
  }
  return isDebitNormal(accountType, metaMap) ? glDebitMinusCredit : -glDebitMinusCredit;
}

export function balanceSheetCategory(
  accountType: number
): "assets" | "liabilities" | "equity" | null {
  if ([1, 2, 3].includes(accountType)) return "assets";
  if ([4, 5].includes(accountType)) return "liabilities";
  if ([6, 7].includes(accountType)) return "equity";
  return null;
}

/** Uses GL Account Class from chart setup when meta is available. */
export function balanceSheetCategoryForAccount(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): "assets" | "liabilities" | "equity" | null {
  const meta = metaFor(accountType, metaMap);
  if (meta?.classId) {
    if (meta.classId === "1") return "assets";
    if (meta.classId === "2") {
      return accountType === 6 || accountType === 7 ? "equity" : "liabilities";
    }
    return null;
  }
  return balanceSheetCategory(accountType);
}

export function balanceSheetSection(accountType: number): BalanceSheetSection | null {
  switch (accountType) {
    case 3:
      return "capital_assets";
    case 1:
    case 2:
      return "current_assets";
    case 5:
      return "long_term_liabilities";
    case 4:
      return "current_liabilities";
    case 6:
      return "share_capital";
    case 7:
      return "retained_earnings";
    default:
      return null;
  }
}

export function isJournalCreditNormalDisplay(
  accountType: number,
  metaMap?: Map<number, ChartGroupMeta>
): boolean {
  return isCreditNormal(accountType, metaMap) && accountType !== 6 && accountType !== 7;
}

export function chartMastersToTypeMap(
  chartMasters: Array<{ account_code?: string | number; account_type?: string | number }>
): Map<string, number> {
  const map = new Map<string, number>();
  chartMasters.forEach((cm) => {
    const code = String(cm.account_code ?? "").trim();
    if (!code) return;
    map.set(code, Number(cm.account_type) || 0);
  });
  return map;
}

export function formatBsAmount(value: number): string {
  if (Math.abs(value) < 0.001) return "0.00";
  const abs = Math.abs(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-${abs}` : abs;
}
