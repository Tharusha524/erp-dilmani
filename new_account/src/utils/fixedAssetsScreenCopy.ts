/** Fixed Assets — screen descriptions and item display labels */

export type FaScreenKey =
  | "purchase"
  | "transfer"
  | "disposal"
  | "sale"
  | "depreciation"
  | "movements"
  | "inquiry"
  | "reports"
  | "assetMaster"
  | "category"
  | "location"
  | "class";

export type FaScreenCopy = {
  title: string;
  summary: string;
  bullets: string[];
  glNote?: string;
};

export const FA_SCREEN_COPY: Record<FaScreenKey, FaScreenCopy> = {
  purchase: {
    title: "Fixed Assets Purchase",
    summary:
      "Record buying a capital asset (buildings, machinery, vehicles, computers, furniture). The asset is added to the books and a supplier invoice is posted.",
    bullets: [
      "Select supplier, receive location, and fixed asset item (item code + description).",
      "Enter purchase price — this becomes the asset cost on the balance sheet.",
      "GL: Dr Asset account · Cr Accounts Payable (or Bank if cash purchase).",
    ],
    glNote: "Asset cost is capitalized; depreciation starts from the depreciation start date on the item.",
  },
  transfer: {
    title: "Fixed Assets Location Transfer",
    summary:
      "Move an asset from one location or department to another. Quantity and location records are updated only.",
    bullets: [
      "Select asset from location (from) and destination location (to).",
      "No change to asset cost, depreciation, or GL balances.",
      "Use when equipment moves between branches, warehouses, or departments.",
    ],
    glNote: "No GL entry is created for location transfers.",
  },
  disposal: {
    title: "Fixed Assets Disposal",
    summary:
      "Write off or scrap an asset that is no longer used. Remaining book value is removed from the books.",
    bullets: [
      "Select asset and location; system uses cost minus accumulated depreciation (net book value).",
      "GL: Dr Accumulated Depreciation · Dr Loss on Disposal · Cr Asset account.",
      "Asset is marked inactive when fully disposed.",
    ],
    glNote: "Use when the asset is discarded — not sold for cash.",
  },
  sale: {
    title: "Fixed Assets Sale",
    summary:
      "Sell an asset to a customer. Sale price is compared with net book value to determine gain or loss.",
    bullets: [
      "Select customer, asset location, and fixed asset item with sale price.",
      "System posts delivery (remove asset) and sales invoice (revenue).",
      "Gain: sale price > book value · Loss: sale price < book value.",
    ],
    glNote:
      "GL: Dr Bank/AR · Dr Accumulated Depreciation · Cr Asset · Cr Sales / Dr Loss (or Cr Gain on disposal).",
  },
  depreciation: {
    title: "Process Depreciation",
    summary:
      "Run periodic depreciation for all active fixed assets using straight line or other method configured on each item.",
    bullets: [
      "Straight line: (Cost − Salvage Value) ÷ Useful Life — charged each period.",
      "Preview shows expense per asset; select assets and process to post.",
      "GL: Dr Depreciation Expense · Cr Accumulated Depreciation.",
    ],
    glNote:
      "Reduces profit in P&L and net asset value on the balance sheet. Land typically has no depreciation.",
  },
  movements: {
    title: "Fixed Asset Movements",
    summary:
      "View history of all stock moves for fixed assets — purchases, transfers, disposals, and sales.",
    bullets: [
      "Filter by asset item, location, and date range.",
      "Shows transaction type, reference, quantity, and date for audit trail.",
    ],
  },
  inquiry: {
    title: "Fixed Assets Inquiry",
    summary:
      "List all fixed assets with cost, accumulated depreciation, current book value, and status.",
    bullets: [
      "Search active assets; optionally include inactive (disposed/sold).",
      "Columns: class, description, depreciation method, initial cost, depreciations, current value.",
      "Balance sheet net asset = Initial cost − Accumulated depreciation.",
    ],
  },
  reports: {
    title: "Fixed Asset Reports",
    summary:
      "Print valuation and analytical reports for management and audit — asset register, depreciation summary, and related GL.",
    bullets: [
      "Fixed Assets Valuation — cost, depreciation, and net book value by class/location.",
      "Use Reports menu with Fixed Assets class selected.",
    ],
  },
  assetMaster: {
    title: "Fixed Asset Items",
    summary:
      "Define capital assets before purchase or depreciation — item code, description, GL accounts, depreciation method, salvage value, and useful life.",
    bullets: [
      "Item appears on transaction screens as CODE — Description (searchable picker).",
      "Set Asset account, Depreciation Expense, and Accumulated Depreciation GL accounts.",
      "Straight line: (Cost − Salvage Value) ÷ Useful Life — depreciation start date controls when expense begins.",
    ],
    glNote: "Purchase posts to the Asset account; depreciation posts Dr Expense · Cr Accumulated Depreciation.",
  },
  category: {
    title: "Fixed Asset Categories",
    summary:
      "Group fixed assets and assign default GL accounts, tax type, and unit of measure for new asset items.",
    bullets: [
      "Categories with Item Type Fixed Asset (mb_flag = 4) appear when creating asset items.",
      "Default accounts flow to new items — override per item in General Settings if needed.",
    ],
  },
  location: {
    title: "Fixed Asset Locations",
    summary:
      "Define where assets are kept — office, warehouse, branch, or department — used on purchase, transfer, and inquiry.",
    bullets: [
      "Receive Into on purchase sets initial asset location.",
      "Location transfer moves quantity between locations without GL impact.",
    ],
  },
  class: {
    title: "Fixed Asset Classes",
    summary:
      "Classify assets by type — buildings, machinery, vehicles, computers, furniture — for reporting and default depreciation.",
    bullets: [
      "Link class to default depreciation method and rate on asset items.",
      "Used on Fixed Assets Inquiry and valuation reports.",
    ],
  },
};

/** Menu card subtitles for transaction / inquiry hubs */
export const FA_MENU_CARD_COPY: Partial<Record<FaScreenKey, string>> = {
  purchase: "Buy assets · Dr Asset · Cr Payable",
  transfer: "Move between locations · No GL",
  disposal: "Write off asset · Loss GL",
  sale: "Sell to customer · Gain/Loss GL",
  depreciation: "Run period depreciation · Expense GL",
  movements: "View purchase, transfer, sale history",
  inquiry: "Cost, depreciation & book value list",
  reports: "Valuation & register reports",
  assetMaster: "Item code, GL, depreciation setup",
  category: "Default GL per asset category",
  location: "Office, warehouse, branch locations",
  class: "Buildings, machinery, vehicles…",
};

export type FaItemLike = {
  stock_id?: string | number;
  id?: string | number;
  description?: string;
  long_description?: string;
};

/** Item dropdown label: CODE — Description (like sales/purchase item pickers) */
export function formatFaItemLabel(item: FaItemLike): string {
  const code = String(item.stock_id ?? item.id ?? "").trim();
  const name = String(item.description ?? "").trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return name || code || "—";
}

export function findFaItemByStockId<T extends FaItemLike>(
  items: T[],
  stockId: string | number | null | undefined
): T | undefined {
  if (stockId == null || stockId === "") {
    return undefined;
  }
  const id = String(stockId);
  return items.find((it) => String(it.stock_id ?? it.id ?? "") === id);
}

export function findFaItemByDescription<T extends FaItemLike & { stock_id?: string }>(
  items: T[],
  descriptionValue: string
): T | undefined {
  const v = String(descriptionValue ?? "").trim();
  if (!v) {
    return undefined;
  }
  return items.find(
    (it) =>
      formatFaItemLabel(it) === v ||
      String(it.description ?? "").trim() === v ||
      String(it.stock_id ?? "").trim() === v
  );
}
