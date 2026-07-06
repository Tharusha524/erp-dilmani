export interface TrialBalanceRowLike {
  account: string;
  accountType: number;
  classId?: string;
  className?: string;
  typeName?: string;
}

/** FrontAccounting account_type → chart class bucket */
const TYPE_CLASS_HINTS: Record<number, string[]> = {
  1: ["ASSET"],
  2: ["ASSET", "INVENT"],
  3: ["ASSET", "CAPITAL"],
  4: ["LIABIL", "CURRENT"],
  5: ["LIABIL", "LONG"],
  6: ["LIABIL", "EQUIT", "SHARE", "CAPITAL"],
  7: ["LIABIL", "EQUIT", "RETAIN"],
  8: ["INCOME", "REVENUE", "SALES"],
  9: ["INCOME", "REVENUE"],
  10: ["COST", "EXPENSE"],
  11: ["COST", "EXPENSE", "PAYROLL"],
  12: ["COST", "EXPENSE", "ADMIN"],
};

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

function findChartClass(
  chartClasses: any[],
  classId: unknown
): { classId: number | string; className: string } | null {
  const id = normalizeId(classId);
  if (!id) return null;

  const classObj = chartClasses.find(
    (c) => normalizeId(c.cid) === id || normalizeId(c.id) === id
  );

  if (!classObj) return null;

  return {
    classId: classObj.cid ?? classObj.id,
    className: String(classObj.class_name ?? classObj.name ?? "Unknown"),
  };
}

function fallbackClassByType(accountType: number, chartClasses: any[]): { classId: number | string; className: string } | null {
  const hints = TYPE_CLASS_HINTS[accountType];
  if (!hints) return null;

  const upperClasses = chartClasses.map((c) => ({
    ...c,
    upper: String(c.class_name ?? c.name ?? "").toUpperCase(),
  }));

  for (const hint of hints) {
    const match = upperClasses.find((c) => c.upper.includes(hint));
    if (match) {
      return {
        classId: match.cid ?? match.id,
        className: String(match.class_name ?? match.name),
      };
    }
  }

  return null;
}

export function buildAccountTypeToClassMap(chartTypes: any[], chartClasses: any[]): Record<string, { classId: number | string; className: string }> {
  const mapping: Record<string, { classId: number | string; className: string }> = {};

  chartTypes.forEach((chartType) => {
    const typeId = normalizeId(chartType.id);
    if (!typeId) return;

    const resolved =
      findChartClass(chartClasses, chartType.class_id) ??
      fallbackClassByType(Number(typeId), chartClasses);

    if (resolved) {
      mapping[typeId] = resolved;
    }
  });

  // Ensure every standard account type has a class bucket
  for (let type = 1; type <= 12; type += 1) {
    const key = String(type);
    if (mapping[key]) continue;
    const resolved = fallbackClassByType(type, chartClasses);
    if (resolved) {
      mapping[key] = resolved;
    }
  }

  return mapping;
}

export function resolveRowClass(
  row: TrialBalanceRowLike,
  accountTypeToClassMap: Record<string, { classId: number | string; className: string }>,
  chartClasses: any[]
): { classId: number | string; className: string } {
  if (row.className) {
    return {
      classId: row.classId ?? 0,
      className: row.className,
    };
  }

  const typeKey = String(row.accountType);
  const fromMap = accountTypeToClassMap[typeKey];
  if (fromMap) return fromMap;

  const fallback = fallbackClassByType(row.accountType, chartClasses);
  if (fallback) return fallback;

  return { classId: 0, className: "Other" };
}

export function resolveRowGroupName(
  row: TrialBalanceRowLike,
  accountTypeLabelMap: Record<string, string>
): string {
  if (row.typeName) {
    return row.typeName;
  }
  return accountTypeLabelMap[String(row.accountType)] || "Unknown";
}

export function buildAccountTypeLabelMap(chartTypes: any[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  chartTypes.forEach((chartType) => {
    const id = normalizeId(chartType.id);
    if (!id) return;
    mapping[id] = String(chartType.name ?? chartType.type_name ?? `Type ${id}`);
  });

  const defaults: Record<string, string> = {
    "1": "Current Assets",
    "2": "Inventory Assets",
    "3": "Capital Assets",
    "4": "Current Liabilities",
    "5": "Long Term Liabilities",
    "6": "Share Capital",
    "7": "Retained Earnings",
    "8": "Sales Revenue",
    "9": "Other Revenue",
    "10": "Cost of Good Sold",
    "11": "Payroll Expenses",
    "12": "General and Administrative Expenses",
  };

  return { ...defaults, ...mapping };
}

export interface BalanceSheetRowLike extends TrialBalanceRowLike {
  code: string;
  description: string;
  classId: string;
  className: string;
  typeName: string;
  opening: number;
  period: number;
  closing: number;
  isCalculatedReturn?: boolean;
}

/** Group balance-sheet rows by GL Account Class → GL Account Group (same as Trial Balance). */
export function groupRowsByClassAndGroup<T extends TrialBalanceRowLike>(
  rows: T[],
  chartClasses: any[],
  accountTypeToClassMap: Record<string, { classId: number | string; className: string }>,
  accountTypeLabelMap: Record<string, string>
): Record<string, Record<string, T[]>> {
  const classGroups: Record<string, Record<string, T[]>> = {};

  chartClasses.forEach((chartClass: any) => {
    const className = String(chartClass.class_name ?? chartClass.name ?? "");
    if (className && !classGroups[className]) {
      classGroups[className] = {};
    }
  });

  rows.forEach((row) => {
    const classInfo = resolveRowClass(row, accountTypeToClassMap, chartClasses);
    const className = classInfo.className;
    if (!classGroups[className]) {
      classGroups[className] = {};
    }

    const groupName = resolveRowGroupName(row, accountTypeLabelMap);
    if (!classGroups[className][groupName]) {
      classGroups[className][groupName] = [];
    }
    classGroups[className][groupName].push(row);
  });

  return classGroups;
}

export function sumBsSlice(
  rows: Array<{ opening: number; period: number; closing: number }>
): { opening: number; period: number; closing: number } {
  return rows.reduce(
    (acc, row) => ({
      opening: acc.opening + (row.opening || 0),
      period: acc.period + (row.period || 0),
      closing: acc.closing + (row.closing || 0),
    }),
    { opening: 0, period: 0, closing: 0 }
  );
}

export function rowHasActivity(row: {
  broughtForwardDebit: string;
  broughtForwardCredit: string;
  thisPeriodDebit: string;
  thisPeriodCredit: string;
  balanceDebit: string;
  balanceCredit: string;
}): boolean {
  const nums = [
    row.broughtForwardDebit,
    row.broughtForwardCredit,
    row.thisPeriodDebit,
    row.thisPeriodCredit,
    row.balanceDebit,
    row.balanceCredit,
  ];
  return nums.some((v) => Math.abs(parseFloat(String(v)) || 0) > 0.001);
}
