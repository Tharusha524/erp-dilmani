export interface HelpSection {
  title: string;
  items: string[];
}

export interface HelpGuideEntry {
  id: string;
  module: string;
  /** Longest matching path prefix wins */
  pathPrefix: string;
  title: string;
  summary: string;
  workflow?: string;
  sections: HelpSection[];
}

export const HELP_MODULES = [
  "Dashboard",
  "Sales",
  "Purchase",
  "Items and Inventory",
  "Manufacturing",
  "Fixed Assets",
  "Dimension",
  "Banking and GL",
  "Setup",
] as const;

export const SETUP_CHECKLIST: string[] = [
  "Company Setup — company name, logo, home currency, module flags",
  "Users & Access — create users and assign security roles",
  "Fiscal Years — open a year that includes today",
  "Taxes — tax types, tax groups, item tax types",
  "System & General GL Setup — default AR, AP, inventory, COGS, revenue accounts",
  "Chart of Accounts & GL Accounts — install or create accounts",
  "Bank Accounts & Currencies — cash/bank accounts and exchange rates",
  "Inventory Locations & Items — warehouses and stock items with GL accounts",
  "Customers & Suppliers — master data for trading partners",
  "Run System Diagnostics (Setup → Maintenance) before go-live",
];

export const HELP_GUIDE_ENTRIES: HelpGuideEntry[] = [
  {
    id: "dashboard",
    module: "Dashboard",
    pathPrefix: "/dashboard",
    title: "Dashboard",
    summary: "Overview of key business metrics and quick access to modules.",
    sections: [
      {
        title: "What you can do",
        items: [
          "Review sales, purchase, and inventory summaries.",
          "Use the sidebar to open Transactions, Maintenance, or Reports.",
          "Check the fiscal year badge in the top bar.",
        ],
      },
    ],
  },
  {
    id: "sales-order-entry",
    module: "Sales",
    pathPrefix: "/sales/transactions/sales-order-entry",
    title: "Sales Order Entry",
    summary: "Create confirmed customer orders before delivery or invoicing.",
    workflow: "Quotation → Sales Order → Delivery → Invoice → Payment → Allocation",
    sections: [
      {
        title: "Steps",
        items: [
          "Select customer and delivery branch.",
          "Add line items with quantity, price, and tax.",
          "Save — stock is reserved according to system settings.",
          "Fulfill via Delivery Against Sales Orders.",
        ],
      },
      {
        title: "Tips",
        items: [
          "Check customer credit status before saving large orders.",
          "Use Direct Delivery or Direct Invoice for one-step flows.",
        ],
      },
    ],
  },
  {
    id: "sales-delivery",
    module: "Sales",
    pathPrefix: "/sales/transactions/delivery-against-sales-orders",
    title: "Delivery Against Sales Orders",
    summary: "Ship goods against an existing sales order and reduce inventory.",
    sections: [
      {
        title: "Steps",
        items: [
          "Search and open the sales order.",
          "Enter quantities to deliver per line.",
          "Confirm — creates a delivery note and stock move.",
          "Invoice from Invoice Against Sales Delivery.",
        ],
      },
    ],
  },
  {
    id: "sales-invoice",
    module: "Sales",
    pathPrefix: "/sales/transactions/invoice-against-sales-delivery",
    title: "Invoice Against Sales Delivery",
    summary: "Bill delivered goods to the customer and post to Accounts Receivable.",
    sections: [
      {
        title: "Steps",
        items: [
          "Select the delivery to invoice.",
          "Review amounts, tax, and GL accounts.",
          "Post — creates debtor transaction and GL entries.",
        ],
      },
    ],
  },
  {
    id: "sales-payments",
    module: "Sales",
    pathPrefix: "/sales/transactions/customer-payments",
    title: "Customer Payments",
    summary: "Record money received from customers against bank or cash accounts.",
    workflow: "Payment → Allocate Customer Payments or Credit Notes",
    sections: [
      {
        title: "Steps",
        items: [
          "Select customer, bank account, amount, and date.",
          "Save the payment.",
          "Allocate to open invoices in Allocate Customer Payments.",
        ],
      },
    ],
  },
  {
    id: "sales-transactions",
    module: "Sales",
    pathPrefix: "/sales/transactions",
    title: "Sales Transactions",
    summary: "Daily sales operations: quotes, orders, deliveries, invoices, payments, and credits.",
    workflow: "Quotation → Order → Delivery → Invoice → Payment → Allocation",
    sections: [
      {
        title: "Available transactions",
        items: [
          "Sales Quotation Entry — price quotes",
          "Sales Order Entry — confirmed orders",
          "Direct Delivery / Direct Invoice — skip prior documents",
          "Delivery / Invoice against existing documents",
          "Customer Payments and Credit Notes",
          "Allocate payments and credits to invoices",
          "Recurrent Invoices — periodic billing",
        ],
      },
    ],
  },
  {
    id: "sales-maintenance",
    module: "Sales",
    pathPrefix: "/sales/maintenance",
    title: "Sales Maintenance",
    summary: "Master data for customers and sales configuration.",
    sections: [
      {
        title: "Setup items",
        items: [
          "Customers — contacts, branches, credit limits",
          "Sales Groups, Types, Persons, Areas",
          "Credit Status Setup",
          "Recurrent invoice templates",
        ],
      },
    ],
  },
  {
    id: "sales",
    module: "Sales",
    pathPrefix: "/sales",
    title: "Sales Module",
    summary: "Manage the full customer sales cycle from quotation to cash collection.",
    workflow: "Quotation → Order → Delivery → Invoice → Payment → Allocation",
    sections: [
      {
        title: "Before you start",
        items: [
          "Create customers in Sales → Maintenance.",
          "Define items and pricing in Items and Inventory.",
          "Configure AR and revenue GL accounts in Setup.",
        ],
      },
    ],
  },
  {
    id: "purchase-order",
    module: "Purchase",
    pathPrefix: "/purchase/transactions/purchase-order-entry",
    title: "Purchase Order Entry",
    summary: "Order goods or services from suppliers.",
    workflow: "PO → GRN → Supplier Invoice → Payment → Allocation",
    sections: [
      {
        title: "Steps",
        items: [
          "Select supplier and enter line items.",
          "Save the purchase order.",
          "Receive goods via Receive Purchase Order Items or Direct GRN.",
        ],
      },
    ],
  },
  {
    id: "purchase-grn",
    module: "Purchase",
    pathPrefix: "/purchase/transactions/receive-purchase-order-items",
    title: "Receive Purchase Order Items",
    summary: "Goods receipt (GRN) increases inventory from a purchase order.",
    sections: [
      {
        title: "Steps",
        items: [
          "Open the purchase order.",
          "Enter received quantities per line and location.",
          "Post GRN — stock and GRN clearing accounts update.",
          "Create Supplier Invoice from GRN.",
        ],
      },
    ],
  },
  {
    id: "purchase-transactions",
    module: "Purchase",
    pathPrefix: "/purchase/transactions",
    title: "Purchase Transactions",
    summary: "Supplier purchasing from PO through payment.",
    workflow: "PO → GRN → Supplier Invoice → Payment → Allocation",
    sections: [
      {
        title: "Available transactions",
        items: [
          "Purchase Order Entry",
          "Receive PO Items / Direct GRN",
          "Supplier Invoice (from GRN or direct)",
          "Payment to Suppliers",
          "Supplier Credit Notes and allocation",
        ],
      },
    ],
  },
  {
    id: "purchase",
    module: "Purchase",
    pathPrefix: "/purchase",
    title: "Purchase Module",
    summary: "Manage suppliers, purchase orders, receipts, invoices, and payments.",
    sections: [
      {
        title: "Before you start",
        items: [
          "Create suppliers in Purchase → Maintenance.",
          "Set up inventory locations and items.",
          "Configure AP and GRN clearing accounts in Setup.",
        ],
      },
    ],
  },
  {
    id: "inventory-adjustment",
    module: "Items and Inventory",
    pathPrefix: "/itemsandinventory/transactions/inventory-adjustments",
    title: "Inventory Adjustments",
    summary: "Correct stock quantities (damage, count differences, write-offs).",
    sections: [
      {
        title: "Steps",
        items: [
          "Select location and adjustment type.",
          "Add items with quantity change and reason.",
          "Post — updates loc_stock and GL if configured.",
        ],
      },
    ],
  },
  {
    id: "inventory-transfer",
    module: "Items and Inventory",
    pathPrefix: "/itemsandinventory/transactions/inventory-location-transfer",
    title: "Inventory Location Transfer",
    summary: "Move stock between warehouses or locations.",
    sections: [
      {
        title: "Steps",
        items: [
          "Select from and to locations.",
          "Add items and transfer quantities.",
          "Confirm — no GL impact unless using different valuation.",
        ],
      },
    ],
  },
  {
    id: "inventory",
    module: "Items and Inventory",
    pathPrefix: "/itemsandinventory",
    title: "Items and Inventory",
    summary: "Item master data, stock levels, transfers, adjustments, and pricing.",
    sections: [
      {
        title: "Key areas",
        items: [
          "Maintenance — items, categories, locations, UOM, sales kits",
          "Pricing and Costs — sales price, purchase price, standard cost",
          "Transactions — transfers and adjustments",
          "Inquiries — item movements and stock status",
        ],
      },
      {
        title: "Important",
        items: [
          "Each inventory item needs sales, COGS, and inventory GL accounts.",
          "Stock also moves from Sales deliveries and Purchase GRNs automatically.",
        ],
      },
    ],
  },
  {
    id: "manufacturing-wo",
    module: "Manufacturing",
    pathPrefix: "/manufacturing/transactions/work-order-entry",
    title: "Work Order Entry",
    summary: "Create production orders from Bills of Material.",
    workflow: "BOM → Work Order → Release → Issue → Produce → Cost",
    sections: [
      {
        title: "Steps",
        items: [
          "Select finished item and quantity.",
          "Create work order.",
          "Release, issue raw materials, record production, then cost.",
        ],
      },
    ],
  },
  {
    id: "manufacturing",
    module: "Manufacturing",
    pathPrefix: "/manufacturing",
    title: "Manufacturing",
    summary: "Produce finished goods using BOMs and work orders. Enable in Company Setup.",
    workflow: "BOM → Work Order → Release → Issue → Produce → Cost",
    sections: [
      {
        title: "Maintenance",
        items: ["Bills of Materials — components per finished item", "Work Centers — production resources"],
      },
    ],
  },
  {
    id: "fixed-assets",
    module: "Fixed Assets",
    pathPrefix: "/fixedassets",
    title: "Fixed Assets",
    summary: "Track capital assets, depreciation, transfers, disposal, and sale. Enable Fixed Assets in Company Setup.",
    sections: [
      {
        title: "Transactions",
        items: [
          "Fixed Assets Purchase — buy assets; Dr Asset · Cr Payable. Select item as CODE — Description.",
          "Location Transfer — move between sites; no GL entry.",
          "Disposal — write off scrap; Dr Accum Dep · Dr Loss · Cr Asset.",
          "Sale — sell to customer; compares sale price vs book value for gain/loss.",
          "Process Depreciation — (Cost − Salvage) ÷ Useful Life; Dr Expense · Cr Accum Dep.",
        ],
      },
      {
        title: "Inquiries & Reports",
        items: [
          "Fixed Asset Movements — history of purchases, transfers, sales.",
          "Fixed Assets Inquiry — cost, depreciation, and current book value.",
          "Fixed Asset Reports — valuation register from Reports menu.",
        ],
      },
    ],
  },
  {
    id: "dimension",
    module: "Dimension",
    pathPrefix: "/dimension",
    title: "Dimension",
    summary: "Analytical tagging for projects or cost centers. Enable in Company Setup.",
    sections: [
      {
        title: "Usage",
        items: [
          "Define dimension tags in Maintenance.",
          "Create dimensions in Dimension Entry.",
          "Assign dimensions on transactions where supported.",
        ],
      },
    ],
  },
  {
    id: "banking-journal",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger/transactions/journal-entry",
    title: "Journal Entry",
    summary: "Manual general ledger postings (debits and credits must balance).",
    sections: [
      {
        title: "Steps",
        items: [
          "Enter date, reference, and memo.",
          "Add GL lines with debit or credit amounts.",
          "Ensure total debits equal total credits before posting.",
        ],
      },
    ],
  },
  {
    id: "banking-accruals",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger/transactions/revenue-cost-accruals",
    title: "Revenue / Cost Accruals",
    summary: "Accrue income or expenses for a period before cash moves.",
    sections: [
      {
        title: "Steps",
        items: [
          "Select accrual type (revenue or cost).",
          "Choose accounts and amounts for the period.",
          "Preview then process to post GL entries.",
        ],
      },
    ],
  },
  {
    id: "banking-reconcile",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger/transactions/reconcile-bank-account",
    title: "Reconcile Bank Account",
    summary: "Match system bank transactions to your bank statement.",
    sections: [
      {
        title: "Steps",
        items: [
          "Select bank account and statement date.",
          "Mark cleared transactions.",
          "Save reconciliation when balances match.",
        ],
      },
    ],
  },
  {
    id: "banking-transactions",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger/transactions",
    title: "Banking Transactions",
    summary: "Cash management, journals, budgets, reconciliation, and accruals.",
    sections: [
      {
        title: "Available transactions",
        items: [
          "Payments and Deposits",
          "Bank Account Transfers",
          "Journal Entry",
          "Budget Entry",
          "Reconcile Bank Account",
          "Revenue / Cost Accruals",
        ],
      },
    ],
  },
  {
    id: "banking-reports",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger/inquiriesandreports",
    title: "Banking Inquiries and Reports",
    summary: "Financial reporting and GL analysis.",
    sections: [
      {
        title: "Reports",
        items: [
          "Trial Balance, Balance Sheet, Profit and Loss",
          "Journal Inquiry, GL Inquiry, Bank Account Inquiry",
          "Tax Inquiry",
        ],
      },
    ],
  },
  {
    id: "banking",
    module: "Banking and GL",
    pathPrefix: "/bankingandgeneralledger",
    title: "Banking and General Ledger",
    summary: "Chart of accounts, bank accounts, journals, and financial statements.",
    sections: [
      {
        title: "Maintenance essentials",
        items: [
          "GL Accounts, Groups, and Classes",
          "Bank Accounts and Currencies",
          "Exchange Rates and Account Tags",
        ],
      },
    ],
  },
  {
    id: "system-diagnostics",
    module: "Setup",
    pathPrefix: "/setup/maintenance/system-diagnostics",
    title: "System Diagnostics",
    summary: "Health checks for database, GL setup, fiscal year, inventory, and balances.",
    sections: [
      {
        title: "When to run",
        items: [
          "After initial company setup.",
          "Before go-live and after major configuration changes.",
          "When transactions fail to post or reports look wrong.",
        ],
      },
      {
        title: "Checks include",
        items: [
          "Company profile and home currency",
          "Critical GL default accounts",
          "Open fiscal year",
          "Chart of accounts and GL balance",
          "Item GL accounts and negative stock",
        ],
      },
    ],
  },
  {
    id: "setup-company",
    module: "Setup",
    pathPrefix: "/setup/companysetup",
    title: "Company Setup",
    summary: "Core system configuration: company, users, taxes, fiscal year, GL defaults.",
    sections: [
      {
        title: "Recommended order",
        items: SETUP_CHECKLIST,
      },
    ],
  },
  {
    id: "setup",
    module: "Setup",
    pathPrefix: "/setup",
    title: "Setup",
    summary: "Administration, security, taxes, and system maintenance.",
    sections: [
      {
        title: "Areas",
        items: [
          "Company Setup — users, access, taxes, fiscal year, GL setup",
          "Miscellaneous — payment terms, shipping, POS, contact categories",
          "Maintenance — void transactions, diagnostics, backup, login logs",
        ],
      },
    ],
  },
];
