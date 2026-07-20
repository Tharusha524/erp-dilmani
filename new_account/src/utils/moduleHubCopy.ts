/** Shared screen copy shape for module hub pages and transaction screens */

export type ScreenCopy = {
  title: string;
  summary: string;
  bullets: string[];
  glNote?: string;
};

export type HubSectionKey =
  | "sales:transactions"
  | "sales:maintenance"
  | "sales:inquiries"
  | "purchase:transactions"
  | "purchase:maintenance"
  | "purchase:inquiries"
  | "inventory:transactions"
  | "inventory:maintenance"
  | "inventory:inquiries"
  | "banking:transactions"
  | "banking:maintenance"
  | "banking:inquiries"
  | "costCenter:transactions"
  | "costCenter:maintenance"
  | "costCenter:inquiries"
  | "setup:maintenance"
  | "setup:companysetup"
  | "setup:miscellaneous"
  | "manufacturing:transactions"
  | "manufacturing:maintenance"
  | "manufacturing:inquiries"
  | "fixedassets:transactions"
  | "fixedassets:maintenance"
  | "fixedassets:inquiries";

export const HUB_MODULE_INTRO: Partial<Record<HubSectionKey, ScreenCopy>> = {
  "sales:transactions": {
    title: "Sales Transactions",
    summary: "Create quotations, orders, deliveries, invoices, and customer receipts. Amounts use the customer currency; GL posts in home currency at the exchange rate.",
    bullets: [
      "Select items as CODE — Description on every line.",
      "Quotation → Order → Delivery → Invoice is the standard flow.",
      "Direct Delivery / Direct Invoice skip the sales order when needed.",
      "View / Print on success or inquiry opens the modern A4 document template.",
    ],
  },
  "sales:maintenance": {
    title: "Sales Maintenance",
    summary: "Set up customers, branches, price lists, and sales team before entering transactions.",
    bullets: [
      "Customer currency and payment terms drive pricing and GL.",
      "Sales Types (price lists) control unit prices on orders.",
    ],
  },
  "sales:inquiries": {
    title: "Sales Inquiries & Reports",
    summary: "Search quotations, orders, customer balances, and allocations. Reports show customer and sales analysis.",
    bullets: ["Use Customer Transaction Inquiry for invoice and payment history."],
  },
  "purchase:transactions": {
    title: "Purchase Transactions",
    summary: "Create purchase orders, receive goods (GRN), post supplier invoices, and record supplier payments.",
    bullets: [
      "Select items as CODE — Description on every line.",
      "PO → GRN → Supplier Invoice is the standard flow.",
      "Direct GRN / Direct Invoice for goods received without a PO.",
      "View / Print opens the same professional template as sales documents.",
    ],
  },
  "purchase:maintenance": {
    title: "Purchase Maintenance",
    summary: "Maintain suppliers, payment terms, and purchasing defaults used on purchase documents.",
    bullets: ["Supplier currency affects purchase pricing and exchange rate on posting."],
  },
  "purchase:inquiries": {
    title: "Purchase Inquiries & Reports",
    summary: "View open purchase orders, supplier transactions, payment allocations, and purchasing reports.",
    bullets: [],
  },
  "inventory:transactions": {
    title: "Inventory Transactions",
    summary: "Move stock between locations or adjust quantities and costs. Updates stock on hand and inventory GL.",
    bullets: [
      "Location Transfer — move qty between warehouses (no sales/purchase).",
      "Adjustments — correct stock count or standard cost.",
    ],
  },
  "inventory:maintenance": {
    title: "Inventory Maintenance",
    summary: "Define items, categories, locations, units, and reorder levels used across sales and purchasing.",
    bullets: [
      "Each item has sales, purchase, inventory, and COGS GL accounts.",
      "Item code + description appear on all transaction screens.",
    ],
  },
  "inventory:inquiries": {
    title: "Inventory Inquiries & Reports",
    summary: "Track stock movements, quantities on hand by location, and print inventory valuation reports.",
    bullets: [],
  },
  "banking:transactions": {
    title: "Banking & GL Transactions",
    summary: "Record bank payments and deposits, journal entries, budgets, accruals, and bank reconciliation.",
    bullets: [
      "All amounts post to the general ledger in home currency.",
      "Journal Entry — manual Dr/Cr lines (must balance).",
    ],
    glNote: "Trial Balance, Balance Sheet, and P&L read posted GL amounts in home currency.",
  },
  "banking:maintenance": {
    title: "Banking & GL Maintenance",
    summary: "Chart of accounts, bank accounts, currencies, exchange rates, and GL structure.",
    bullets: [
      "Set exchange rates before posting foreign-currency sales or purchases.",
      "System Preferences link default GL accounts for each module.",
    ],
  },
  "banking:inquiries": {
    title: "Banking & GL Inquiries & Reports",
    summary: "Journal and GL inquiry, bank balances, tax inquiry, Trial Balance, Balance Sheet, and P&L.",
    bullets: [
      "Financial reports show amounts in home currency (LKR).",
    ],
  },
  "costCenter:transactions": {
    title: "CostCenter Transactions",
    summary: "Create and manage analytical costCenters (projects, departments, cost centres) on transactions.",
    bullets: [
      "Assign costCenters on sales, purchase, and journal lines where enabled.",
    ],
  },
  "costCenter:maintenance": {
    title: "CostCenter Maintenance",
    summary: "Define costCenter tags used to analyse income and expenses by project or department.",
    bullets: [],
  },
  "costCenter:inquiries": {
    title: "CostCenter Inquiries & Reports",
    summary: "Search costCenter activity and print costCenter analysis reports.",
    bullets: [],
  },
  "setup:maintenance": {
    title: "Setup & Administration",
    summary: "Void transactions, view/print documents, backups, diagnostics, and user login audit.",
    bullets: [
      "Use Company Setup for home currency, fiscal year, taxes, and GL preferences.",
      "System Diagnostics checks missing GL accounts and setup issues.",
    ],
  },
  "setup:companysetup": {
    title: "Company Setup",
    summary: "Core company configuration — identity, users, taxes, fiscal year, and default GL accounts.",
    bullets: [
      "Set home currency and enabled modules in Company Setup first.",
      "System and General GL Setup links default accounts for sales, purchase, and inventory.",
      "Transaction References control document numbering (e.g. INV/2026).",
    ],
  },
  "setup:miscellaneous": {
    title: "Miscellaneous Setup",
    summary: "Supporting master data used on sales and purchase documents.",
    bullets: [
      "Payment Terms drive due dates and cash/credit behaviour on orders.",
      "Shipping Company appears on delivery documents.",
    ],
  },
  "manufacturing:transactions": {
    title: "Manufacturing Transactions",
    summary: "Create and process work orders — release, issue materials, add costs, and receive finished goods.",
    bullets: [
      "Work Order Entry — plan production for a finished item (BOM).",
      "Outstanding Work Orders — Release, then Produce (BOM components consumed on produce).",
      "Water Bottle demo: run php artisan manufacturing:water-bottle-demo on the backend, then WO 100 → Release → Produce 98 → Sales 20.",
      "GL: Dr WIP / Cr inventory when issuing; finished goods on produce.",
    ],
  },
  "manufacturing:maintenance": {
    title: "Manufacturing Maintenance",
    summary: "Define bills of materials (BOM) and work centres before creating work orders.",
    bullets: [
      "BOM lists components and quantities per finished item.",
      "Work Centres are production resources/locations.",
    ],
  },
  "manufacturing:inquiries": {
    title: "Manufacturing Inquiries & Reports",
    summary: "Analyse BOM costs, where items are used, and work order status.",
    bullets: [],
  },
  "fixedassets:transactions": {
    title: "Fixed Assets Transactions",
    summary: "Purchase, transfer, dispose, sell, and depreciate capital assets (buildings, machinery, vehicles, computers, furniture).",
    bullets: [
      "Purchase — Dr Asset account · Cr Accounts Payable (or Bank if cash). Cost is capitalized on the balance sheet.",
      "Select supplier, receive location, and fixed asset item (CODE — Description searchable picker).",
      "Depreciation — straight line from item setup: (Cost − Salvage) ÷ Useful Life.",
      "Location transfer — no GL; disposal and sale post gain/loss on net book value.",
    ],
  },
  "fixedassets:maintenance": {
    title: "Fixed Assets Maintenance",
    summary: "Define asset items, classes, categories, and locations before purchase or depreciation.",
    bullets: [
      "Each asset item needs GL accounts: Asset, Depreciation Expense, Accumulated Depreciation.",
    ],
  },
  "fixedassets:inquiries": {
    title: "Fixed Assets Inquiries & Reports",
    summary: "Asset register, movement history, book value inquiry, and valuation reports.",
    bullets: [],
  },
};

/** Short subtitle on each hub card — keyed by route path */
export const HUB_CARD_DESCRIPTIONS: Record<string, string> = {
  // Sales transactions
  "/sales/transactions/sales-quotation-entry": "Price quote for customer — no stock or GL yet",
  "/sales/transactions/apparel-order-sheet": "Record custom apparel order sizing and designs",
  "/sales/transactions/sales-order-entry": "Customer order — reserves sales workflow",
  "/sales/transactions/direct-delivery": "Deliver goods without prior order",
  "/sales/transactions/direct-invoice": "Invoice customer directly",
  "/sales/transactions/delivery-against-sales-orders": "Dispatch items from sales order",
  "/sales/transactions/invoice-against-sales-delivery": "Bill customer for delivered goods",
  "/sales/transactions/invoice-prepaid-orders": "Final invoice for prepaid/cash orders",
  "/sales/transactions/template-delivery": "Repeat delivery from template order",
  "/sales/transactions/template-invoice": "Repeat invoice from template",
  "/sales/transactions/create-print-recurrent-invoices": "Auto-generate recurring invoices",
  "/sales/transactions/customer-payments": "Receive payment · Dr Bank · Cr Receivable",
  "/sales/transactions/customer-credit-notes": "Return or credit customer",
  "/sales/transactions/allocate-customer-payments-credit-notes": "Match payments to invoices",
  // Sales maintenance
  "/sales/maintenance/add-and-manage-customers": "Customer master — currency & terms",
  "/sales/maintenance/customer-branches": "Delivery and billing branches",
  "/sales/maintenance/sales-groups": "Group customers for pricing",
  "/sales/maintenance/recurrent-invoices": "Templates for recurring billing",
  "/sales/maintenance/sales-types": "Price lists / sale types",
  "/sales/maintenance/sales-persons": "Sales representatives",
  "/sales/maintenance/sales-areas": "Geographic sales areas",
  "/sales/maintenance/credit-status-setup": "Credit limit categories",
  // Sales inquiries
  "/sales/inquiriesandreports/sales-quotation-inquiry": "Search open quotations",
  "/sales/inquiriesandreports/sales-order-inquiry": "Search sales orders",
  "/sales/inquiriesandreports/customer-transaction-inquiry": "Invoices, payments, credits",
  "/sales/inquiriesandreports/customer-allocation-inquiry": "Payment allocation status",
  // Purchase transactions
  "/purchase/transactions/purchase-order-entry": "Order goods from supplier",
  "/purchase/transactions/outstanding-purchase-orders-maintenance": "Edit open purchase orders",
  "/purchase/transactions/receive-purchase-order-items": "GRN against purchase order",
  "/purchase/transactions/direct-grn": "Receive stock without PO",
  "/purchase/transactions/direct-supplier-invoice": "Supplier invoice without GRN",
  "/purchase/transactions/payment-to-suppliers": "Pay supplier · Dr Payable · Cr Bank",
  "/purchase/transactions/supplier-invoice": "Invoice from received goods",
  "/purchase/transactions/supplier-credit-notes": "Supplier return or credit",
  "/purchase/transactions/allocate-supplier-payments-credit-notes": "Match payments to invoices",
  "/purchase/maintenance/suppliers": "Supplier master — currency & terms",
  "/purchase/inquiriesandreports/purchase-orders-inquiry": "Search purchase orders",
  "/purchase/inquiriesandreports/supplier-transaction-inquiry": "Invoices, payments, GRNs",
  "/purchase/inquiriesandreports/supplier-allocation-inquiry": "Payment allocation status",
  // Inventory
  "/itemsandinventory/transactions/inventory-location-transfer": "Move stock between locations",
  "/itemsandinventory/transactions/inventory-adjustments": "Adjust qty or cost · GL inventory",
  "/itemsandinventory/maintenance/items": "Item master — CODE, description, GL",
  "/itemsandinventory/maintenance/foreign-item-codes": "Supplier/customer item codes",
  "/itemsandinventory/maintenance/sales-kits": "Bundle items for sale",
  "/itemsandinventory/maintenance/item-categories": "Default GL accounts per category",
  "/itemsandinventory/maintenance/inventory-locations": "Warehouses and stores",
  "/itemsandinventory/maintenance/units-of-measure": "Kg, Pcs, Box, etc.",
  "/itemsandinventory/maintenance/reorder-levels": "Minimum stock alerts",
  "/itemsandinventory/inquiriesandreports/inventory-item-movements": "Stock in/out history",
  "/itemsandinventory/inquiriesandreports/inventory-item-status": "Qty on hand by location",
  // Banking transactions
  "/bankingandgeneralledger/transactions/payments": "Pay from bank or cash account",
  "/bankingandgeneralledger/transactions/deposits": "Receive into bank account",
  "/bankingandgeneralledger/transactions/bank-account-transfers": "Move funds between banks",
  "/bankingandgeneralledger/transactions/journal-entry": "Manual GL journal — Dr = Cr",
  "/bankingandgeneralledger/transactions/budget-entry": "Enter budget amounts",
  "/bankingandgeneralledger/transactions/reconcile-bank-account": "Match bank statement",
  "/bankingandgeneralledger/transactions/revenue-cost-accruals": "Period accrual entries",
  "/bankingandgeneralledger/maintenance/bank-accounts": "Bank/cash GL links",
  "/bankingandgeneralledger/maintenance/quick-entries": "Shortcut payment types",
  "/bankingandgeneralledger/maintenance/account-tags": "Tag GL accounts",
  "/bankingandgeneralledger/maintenance/currencies": "USD, LKR, etc.",
  "/bankingandgeneralledger/maintenance/exchange-rates": "Rates for foreign currency posting",
  "/bankingandgeneralledger/maintenance/gl-accounts": "Chart of accounts",
  "/bankingandgeneralledger/maintenance/gl-account-groups": "Account groups (types)",
  "/bankingandgeneralledger/maintenance/gl-types": "Account numbering formats (Numeric, Alpha Numeric)",
  "/bankingandgeneralledger/maintenance/gl-account-classes": "Balance sheet / P&L classes",
  "/bankingandgeneralledger/maintenance/closing-gl-transactions": "Year-end close",
  "/bankingandgeneralledger/maintenance/revaluation-of-currency-accounts": "Revalue foreign balances",
  "/bankingandgeneralledger/inquiriesandreports/journal-inquiry": "Search journal entries",
  "/bankingandgeneralledger/inquiriesandreports/gl-inquiry": "Account transaction detail",
  "/bankingandgeneralledger/inquiriesandreports/bank-account-inquiry": "Bank movement history",
  "/bankingandgeneralledger/inquiriesandreports/tax-inquiry": "Tax collected and paid",
  "/bankingandgeneralledger/inquiriesandreports/trial-balance": "All accounts — home currency",
  "/bankingandgeneralledger/inquiriesandreports/balance-sheet-drilldown": "Assets, liabilities, equity",
  "/bankingandgeneralledger/inquiriesandreports/profit-and-loss-drilldown": "Income and expenses",
  // CostCenter
  "/costCenter/transactions/costCenter-entry": "Create project / cost centre",
  "/costCenter/transactions/outstanding-costCenters": "Open costCenter entries",
  "/costCenter/maintenance/costCenter-tags": "CostCenter tag definitions",
  "/costCenter/inquiriesandreports/costCenter-inquiry": "CostCenter balances",
  // Setup
  "/setup/maintenance/void-a-transaction": "Reverse a posted document",
  "/setup/maintenance/view-or-print-transaction": "Find and print any transaction",
  "/setup/maintenance/attach-documents": "Attach files to transactions",
  "/setup/maintenance/system-diagnostics": "Check GL and setup issues",
  "/setup/maintenance/backup-and-restore": "Database backup",
  "/setup/maintenance/user-login-logs": "User access audit",
  // Fixed assets
  "/fixedassets/transactions/fixed-assets-purchase": "Buy asset · Dr Asset · Cr Payable",
  "/fixedassets/transactions/fixed-assets-location-transfer": "Move asset · No GL",
  "/fixedassets/transactions/fixed-assets-disposal": "Write off asset",
  "/fixedassets/transactions/fixed-assets-sale": "Sell asset · Gain/Loss",
  "/fixedassets/transactions/process-depreciation": "Run period depreciation",
  "/fixedassets/inquiriesandreports/fixed-asset-movements": "Asset movement history",
  "/fixedassets/inquiriesandreports/fixed-assets-inquiry": "Cost, depreciation, book value",
  "/fixedassets/maintenance/fixed-assets": "Asset item master — CODE, GL, depreciation",
  "/fixedassets/maintenance/fixed-asset-locations": "Office, warehouse, branch locations",
  "/fixedassets/maintenance/fixed-asset-categories": "Default GL for asset categories",
  "/fixedassets/maintenance/fixed-asset-classes": "Buildings, machinery, vehicles…",
  // Manufacturing
  "/manufacturing/transactions/work-order-entry": "Create production work order from BOM",
  "/manufacturing/transactions/outstanding-work-orders": "Release · Issue · Cost · Produce",
  "/manufacturing/maintenance/bills-of-material": "Components per finished item",
  "/manufacturing/maintenance/work-centres": "Production resources and locations",
  "/manufacturing/inquiriesandreports/costed-bill-of-material-inquiry": "BOM cost breakdown",
  "/manufacturing/inquiriesandreports/inventory-item-where-used-inquiry": "Which BOMs use this item",
  "/manufacturing/inquiriesandreports/work-order-inquiry": "Open and completed work orders",
  // Setup — company
  "/setup/companysetup/company-setup": "Company name, currency, modules",
  "/setup/companysetup/user-account-setup": "User accounts and passwords",
  "/setup/companysetup/access-setup": "Role and permission access",
  "/setup/companysetup/transaction-references": "Document numbering sequences",
  "/setup/companysetup/taxes": "Tax rates and types",
  "/setup/companysetup/tax-groups": "Group taxes for documents",
  "/setup/companysetup/item-tax-types": "Tax class per inventory item",
  "/setup/companysetup/system-and-general-gl-setup": "Default GL accounts (sys prefs)",
  "/setup/companysetup/fiscal-years": "Accounting periods and year-end",
  "/setup/companysetup/user-login-activity": "Who logged in and when",
  // Setup — miscellaneous
  "/setup/miscellaneous/payment-terms": "Cash, credit, due days",
  "/setup/miscellaneous/shipping-company": "Carriers on deliveries",
  "/setup/miscellaneous/point-of-sale": "POS terminal setup",
  "/setup/miscellaneous/contact-categories": "CRM contact grouping",
};

export function hubCardDescription(path: string, fallback = ""): string {
  return HUB_CARD_DESCRIPTIONS[path] ?? fallback;
}

export function hubIntro(key: HubSectionKey): ScreenCopy | null {
  return HUB_MODULE_INTRO[key] ?? null;
}
