/**
 * Resolve P&L account row → module transaction inquiry (sales, purchase, inventory, etc.).
 */

export type PlDrilldownModule =
  | "sales"
  | "purchase"
  | "inventory"
  | "fixed_assets"
  | "manufacturing"
  | "gl";

export interface PlAccountMeta {
  accountType?: number;
  classId?: string;
  typeName?: string;
  accountName?: string;
}

export interface PlPeriodContext {
  fromDate: string;
  toDate: string;
  dimension?: string;
}

export interface PlDrilldownTarget {
  module: PlDrilldownModule;
  label: string;
  path: string;
  state: Record<string, unknown>;
}

function norm(value: string | undefined): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/&AMP;/g, "&");
}

export function resolvePlAccountDrilldown(
  accountCode: string,
  meta: PlAccountMeta,
  period: PlPeriodContext
): PlDrilldownTarget {
  const code = String(accountCode ?? "").trim();
  const type = Number(meta.accountType ?? 0);
  const classId = String(meta.classId ?? "").trim();
  const typeName = norm(meta.typeName);
  const accountName = norm(meta.accountName);

  const glTarget: PlDrilldownTarget = {
    module: "gl",
    label: "GL Transactions",
    path: "/bankingandgeneralledger/inquiriesandreports/gl-inquiry",
    state: {
      selectedAccount: code,
      fromDate: period.fromDate,
      toDate: period.toDate,
      dimension: period.dimension ?? "",
      autoSearch: true,
      fromPl: true,
    },
  };

  if (
    (typeName.includes("SALES REVENUE") || type === 8) &&
    classId !== "5" &&
    classId !== "4" &&
    !typeName.includes("OTHER REVENUE")
  ) {
    return {
      module: "sales",
      label: "Sales",
      path: "/sales/inquiriesandreports/customer-transaction-inquiry",
      state: {
        fromDate: period.fromDate,
        toDate: period.toDate,
        glAccount: code,
        autoSearch: true,
        fromPl: true,
      },
    };
  }

  if (
    (typeName.includes("COST OF GOODS") ||
      typeName.includes("COGS") ||
      type === 10 ||
      accountName.includes("PURCHASE")) &&
    classId !== "3"
  ) {
    return {
      module: "purchase",
      label: "Purchases",
      path: "/purchase/inquiriesandreports/supplier-transaction-inquiry",
      state: {
        fromDate: period.fromDate,
        toDate: period.toDate,
        glAccount: code,
        autoSearch: true,
        fromPl: true,
      },
    };
  }

  if (type === 2 || typeName.includes("INVENTORY")) {
    return {
      module: "inventory",
      label: "Inventory Movements",
      path: "/itemsandinventory/inquiriesandreports/inventory-item-movements",
      state: {
        fromDate: period.fromDate,
        toDate: period.toDate,
        glAccount: code,
        fromPl: true,
      },
    };
  }

  if (type === 3 || typeName.includes("CAPITAL") || accountName.includes("FIXED ASSET")) {
    return {
      module: "fixed_assets",
      label: "Fixed Assets",
      path: "/fixedassets/inquiriesandreports/fixed-assets-inquiry",
      state: {
        glAccount: code,
        fromPl: true,
      },
    };
  }

  if (
    accountName.includes("WIP") ||
    typeName.includes("WORK IN PROGRESS") ||
    typeName.includes("MANUFACTURING")
  ) {
    return {
      module: "manufacturing",
      label: "Work Orders",
      path: "/manufacturing/inquiriesandreports/work-order-inquiry",
      state: {
        fromDate: period.fromDate,
        toDate: period.toDate,
        glAccount: code,
        fromPl: true,
      },
    };
  }

  if (classId === "3" || typeName.includes("OTHER REVENUE") || type === 9) {
    return {
      ...glTarget,
      label: "GL Transactions (Other Income)",
    };
  }

  return glTarget;
}
