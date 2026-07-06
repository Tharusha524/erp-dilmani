export type AiSuggestionType = "tip" | "next" | "warning" | "action";

export interface AiSuggestion {
  id: string;
  type: AiSuggestionType;
  title: string;
  message: string;
  /** Optional route to navigate when user clicks the suggestion */
  path?: string;
  priority: "high" | "medium" | "low";
}

interface SuggestionRule {
  pathPrefix: string;
  suggestions: AiSuggestion[];
}

const RULES: SuggestionRule[] = [
  {
    pathPrefix: "/dashboard",
    suggestions: [
      {
        id: "dash-1",
        type: "action",
        title: "Start with Setup",
        message: "If this is a new company, complete Company Setup and run System Diagnostics before entering transactions.",
        path: "/setup/companysetup",
        priority: "high",
      },
      {
        id: "dash-2",
        type: "tip",
        title: "Check fiscal year",
        message: "Confirm the active fiscal year in the top bar matches the period you are posting into.",
        priority: "medium",
      },
      {
        id: "dash-3",
        type: "next",
        title: "Open Sales or Purchase",
        message: "Use the sidebar to jump to Transactions for daily order, delivery, or invoice work.",
        path: "/sales/transactions",
        priority: "low",
      },
    ],
  },
  {
    pathPrefix: "/sales/transactions/sales-order-entry",
    suggestions: [
      {
        id: "so-1",
        type: "next",
        title: "After saving the order",
        message: "Fulfill stock via Delivery Against Sales Orders, then invoice the delivery.",
        path: "/sales/transactions/delivery-against-sales-orders",
        priority: "high",
      },
      {
        id: "so-2",
        type: "warning",
        title: "Credit limit",
        message: "Verify the customer credit status before saving large orders to avoid approval issues.",
        priority: "high",
      },
      {
        id: "so-3",
        type: "tip",
        title: "One-step options",
        message: "Use Direct Delivery or Direct Invoice when you do not need a separate sales order document.",
        path: "/sales/transactions/direct-delivery",
        priority: "medium",
      },
      {
        id: "so-4",
        type: "action",
        title: "Missing customer?",
        message: "Create the customer in Sales → Maintenance before entering the order.",
        path: "/sales/maintenance/add-and-manage-customers",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/sales/transactions/delivery-against-sales-orders",
    suggestions: [
      {
        id: "del-1",
        type: "next",
        title: "Invoice the delivery",
        message: "Once goods are delivered, create the customer invoice from the delivery note.",
        path: "/sales/transactions/invoice-against-sales-delivery",
        priority: "high",
      },
      {
        id: "del-2",
        type: "warning",
        title: "Stock check",
        message: "Ensure sufficient quantity at the shipping location; use Inventory Adjustments if counts are wrong.",
        path: "/itemsandinventory/transactions/inventory-adjustments",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/sales/transactions/invoice-against-sales-delivery",
    suggestions: [
      {
        id: "inv-1",
        type: "next",
        title: "Record payment",
        message: "When the customer pays, enter Customer Payments then allocate to this invoice.",
        path: "/sales/transactions/customer-payments",
        priority: "high",
      },
      {
        id: "inv-2",
        type: "tip",
        title: "GL posting",
        message: "Invoices post to Accounts Receivable and revenue accounts configured on items or in GL Setup.",
        path: "/setup/companysetup/system-and-general-gl-setup",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/sales/transactions/customer-payments",
    suggestions: [
      {
        id: "pay-1",
        type: "next",
        title: "Allocate payment",
        message: "Match this payment to open invoices so customer balances stay correct.",
        path: "/sales/transactions/allocate-customer-payments-credit-notes",
        priority: "high",
      },
      {
        id: "pay-2",
        type: "action",
        title: "Bank account",
        message: "Select the bank or cash account that received the funds.",
        path: "/bankingandgeneralledger/maintenance/bank-accounts",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/sales/transactions",
    suggestions: [
      {
        id: "sales-tx-1",
        type: "next",
        title: "Standard sales flow",
        message: "Quotation → Sales Order → Delivery → Invoice → Payment → Allocation.",
        priority: "high",
      },
      {
        id: "sales-tx-2",
        type: "tip",
        title: "Recurring billing",
        message: "Set up Recurrent Invoices in Maintenance, then generate from Create and Print Recurrent Invoices.",
        path: "/sales/transactions/create-print-recurrent-invoices",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/sales",
    suggestions: [
      {
        id: "sales-1",
        type: "action",
        title: "Customers first",
        message: "Ensure customers, branches, and credit settings exist before processing orders.",
        path: "/sales/maintenance",
        priority: "high",
      },
      {
        id: "sales-2",
        type: "tip",
        title: "Inquiries",
        message: "Use Customer Transaction Inquiry to trace invoices, payments, and open balances.",
        path: "/sales/inquiriesandreports/customer-transaction-inquiry",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/purchase/transactions/purchase-order-entry",
    suggestions: [
      {
        id: "po-1",
        type: "next",
        title: "Receive goods",
        message: "After the PO is approved, receive items via Receive Purchase Order Items.",
        path: "/purchase/transactions/receive-purchase-order-items",
        priority: "high",
      },
      {
        id: "po-2",
        type: "tip",
        title: "Direct receipt",
        message: "Use Direct GRN when goods arrive without a prior purchase order.",
        path: "/purchase/transactions/direct-grn",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/purchase/transactions/receive-purchase-order-items",
    suggestions: [
      {
        id: "grn-1",
        type: "next",
        title: "Supplier invoice",
        message: "Create the supplier invoice from the GRN to update Accounts Payable.",
        path: "/purchase/transactions/supplier-invoice",
        priority: "high",
      },
      {
        id: "grn-2",
        type: "warning",
        title: "Location",
        message: "Select the correct inventory location — stock updates loc_stock for that warehouse.",
        path: "/itemsandinventory/maintenance/inventory-locations",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/purchase/transactions/supplier-invoice",
    suggestions: [
      {
        id: "si-1",
        type: "next",
        title: "Pay supplier",
        message: "Record Payment to Suppliers, then allocate against the invoice.",
        path: "/purchase/transactions/payment-to-suppliers",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/purchase/transactions/payment-to-suppliers",
    suggestions: [
      {
        id: "sp-1",
        type: "next",
        title: "Allocate payment",
        message: "Link the payment to open supplier invoices.",
        path: "/purchase/transactions/allocate-supplier-payments-credit-notes",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/purchase/transactions",
    suggestions: [
      {
        id: "pur-tx-1",
        type: "next",
        title: "Purchase flow",
        message: "PO → GRN → Supplier Invoice → Payment → Allocation.",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/purchase",
    suggestions: [
      {
        id: "pur-1",
        type: "action",
        title: "Suppliers setup",
        message: "Create supplier records with payment terms before entering purchase orders.",
        path: "/purchase/maintenance/suppliers",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/itemsandinventory/transactions/inventory-adjustments",
    suggestions: [
      {
        id: "adj-1",
        type: "warning",
        title: "Use carefully",
        message: "Adjustments change stock immediately. Add a clear reference and reason for audit trail.",
        priority: "high",
      },
      {
        id: "adj-2",
        type: "tip",
        title: "Negative stock fix",
        message: "If System Diagnostics reports negative stock, correct quantities here or void wrong deliveries.",
        path: "/setup/maintenance/system-diagnostics",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/itemsandinventory/transactions/inventory-location-transfer",
    suggestions: [
      {
        id: "tr-1",
        type: "tip",
        title: "Both locations",
        message: "From and to locations must exist in Maintenance before transferring.",
        path: "/itemsandinventory/maintenance/inventory-locations",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/itemsandinventory",
    suggestions: [
      {
        id: "inv-mod-1",
        type: "action",
        title: "Item GL accounts",
        message: "Each item needs sales, COGS, and inventory accounts or posting will fail.",
        path: "/itemsandinventory/maintenance/items",
        priority: "high",
      },
      {
        id: "inv-mod-2",
        type: "tip",
        title: "Pricing",
        message: "Set Sales Pricing and Standard Costs under Pricing and Costs for accurate margins.",
        path: "/itemsandinventory/pricingandcosts",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/manufacturing/transactions/work-order-entry",
    suggestions: [
      {
        id: "wo-1",
        type: "next",
        title: "Complete the WO",
        message: "Release → Issue materials → Produce finished goods → Run costing.",
        path: "/manufacturing/transactions/outstanding-work-orders",
        priority: "high",
      },
      {
        id: "wo-2",
        type: "action",
        title: "BOM required",
        message: "Define Bills of Material for the finished item before creating work orders.",
        path: "/manufacturing/maintenance/bills-of-materials",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/manufacturing",
    suggestions: [
      {
        id: "mfg-1",
        type: "tip",
        title: "Enable module",
        message: "Manufacturing must be enabled in Company Setup to use work orders and BOM.",
        path: "/setup/companysetup/company-setup",
        priority: "medium",
      },
    ],
  },
  {
    pathPrefix: "/fixedassets/transactions/process-depreciation",
    suggestions: [
      {
        id: "dep-1",
        type: "warning",
        title: "Period end",
        message: "Run depreciation once per period. Preview before processing to review amounts.",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/fixedassets",
    suggestions: [
      {
        id: "fa-1",
        type: "action",
        title: "Asset setup",
        message: "Configure depreciation method, rate, and GL accounts on each fixed asset item.",
        path: "/fixedassets/maintenance/fixed-assets",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/bankingandgeneralledger/transactions/journal-entry",
    suggestions: [
      {
        id: "je-1",
        type: "warning",
        title: "Must balance",
        message: "Total debits must equal total credits before posting a journal entry.",
        priority: "high",
      },
      {
        id: "je-2",
        type: "tip",
        title: "Use costCenters",
        message: "Add costCenter tags on lines when tracking projects or cost centers.",
        priority: "low",
      },
    ],
  },
  {
    pathPrefix: "/bankingandgeneralledger/transactions/reconcile-bank-account",
    suggestions: [
      {
        id: "rec-1",
        type: "tip",
        title: "Match statement",
        message: "Reconcile only when system cleared balance matches your bank statement ending balance.",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/bankingandgeneralledger/transactions/revenue-cost-accruals",
    suggestions: [
      {
        id: "acc-1",
        type: "tip",
        title: "Preview first",
        message: "Use preview to verify accrual amounts and GL accounts before processing.",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/bankingandgeneralledger/inquiriesandreports",
    suggestions: [
      {
        id: "rpt-1",
        type: "action",
        title: "Trial Balance",
        message: "Run Trial Balance first to confirm debits equal credits before financial statements.",
        path: "/bankingandgeneralledger/inquiriesandreports/trial-balance",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/bankingandgeneralledger",
    suggestions: [
      {
        id: "gl-1",
        type: "action",
        title: "GL defaults",
        message: "Configure System & General GL Setup so all modules post to the correct accounts.",
        path: "/setup/companysetup/system-and-general-gl-setup",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/setup/maintenance/system-diagnostics",
    suggestions: [
      {
        id: "diag-1",
        type: "tip",
        title: "Fix errors first",
        message: "Resolve all red (error) items before go-live. Yellow warnings should be reviewed.",
        priority: "high",
      },
      {
        id: "diag-2",
        type: "action",
        title: "GL accounts missing?",
        message: "Open System & General GL Setup to assign receivable, payable, inventory, and COGS accounts.",
        path: "/setup/companysetup/system-and-general-gl-setup",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/setup/companysetup",
    suggestions: [
      {
        id: "setup-1",
        type: "next",
        title: "Setup order",
        message: "Company → Users → Fiscal Year → Taxes → GL Setup → then Banking and Items.",
        priority: "high",
      },
      {
        id: "setup-2",
        type: "next",
        title: "Verify when done",
        message: "Run System Diagnostics after setup to confirm everything is ready.",
        path: "/setup/maintenance/system-diagnostics",
        priority: "high",
      },
    ],
  },
  {
    pathPrefix: "/setup",
    suggestions: [
      {
        id: "setup-root-1",
        type: "action",
        title: "Backup",
        message: "Take a backup before major changes or before go-live.",
        path: "/setup/maintenance/backup-and-restore",
        priority: "medium",
      },
    ],
  },
];

const FALLBACK: AiSuggestion[] = [
  {
    id: "fb-1",
    type: "tip",
    title: "Explore modules",
    message: "Use the sidebar: Transactions for daily work, Maintenance for master data, Inquiries for reports.",
    priority: "medium",
  },
  {
    id: "fb-2",
    type: "action",
    title: "Need setup help?",
    message: "Open the Setup tab in this guide for the new company checklist.",
    priority: "low",
  },
];

function normalizePath(pathname: string): string {
  if (pathname.endsWith("/") && pathname.length > 1) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Contextual AI-style suggestions for the current route (longest prefix match). */
export function getAiSuggestions(pathname: string): AiSuggestion[] {
  const normalized = normalizePath(pathname);

  let best: SuggestionRule | undefined;
  let bestLen = -1;

  for (const rule of RULES) {
    const prefix = rule.pathPrefix;
    const matches =
      normalized === prefix || normalized.startsWith(`${prefix}/`);

    if (matches && prefix.length > bestLen) {
      best = rule;
      bestLen = prefix.length;
    }
  }

  const suggestions = best?.suggestions ?? FALLBACK;

  return [...suggestions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

export const SUGGESTION_TYPE_LABELS: Record<AiSuggestionType, string> = {
  tip: "Tip",
  next: "Next step",
  warning: "Watch out",
  action: "Suggested action",
};

export const SUGGESTION_TYPE_COLORS: Record<
  AiSuggestionType,
  { bg: string; border: string; accent: string }
> = {
  tip: { bg: "#e8f5e9", border: "#a5d6a7", accent: "#2e7d32" },
  next: { bg: "#e3f2fd", border: "#90caf9", accent: "#1565c0" },
  warning: { bg: "#fff3e0", border: "#ffcc80", accent: "#e65100" },
  action: { bg: "#f3e5f5", border: "#ce93d8", accent: "#7b1fa2" },
};
