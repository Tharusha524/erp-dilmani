export type BusinessAdviceCategory =
  | "whatToDoNow"
  | "howToHandle"
  | "businessIdeas"
  | "ownerTips";

export interface BusinessAdviceBlock {
  category: BusinessAdviceCategory;
  title: string;
  items: string[];
}

export interface BusinessConsultingEntry {
  id: string;
  pathPrefix: string;
  businessArea: string;
  headline: string;
  ownerSummary: string;
  blocks: BusinessAdviceBlock[];
  path?: string;
}

export const BUSINESS_CATEGORY_META: Record<
  BusinessAdviceCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  whatToDoNow: {
    label: "What to do now",
    icon: "⚡",
    color: "#1565c0",
    bg: "#e3f2fd",
  },
  howToHandle: {
    label: "How to handle it",
    icon: "📋",
    color: "#2e7d32",
    bg: "#e8f5e9",
  },
  businessIdeas: {
    label: "Business ideas",
    icon: "💡",
    color: "#7b1fa2",
    bg: "#f3e5f5",
  },
  ownerTips: {
    label: "Owner advice",
    icon: "🎯",
    color: "#e65100",
    bg: "#fff3e0",
  },
};

const ENTRIES: BusinessConsultingEntry[] = [
  {
    id: "biz-dashboard",
    pathPrefix: "/dashboard",
    businessArea: "General Management",
    headline: "Run your business from one control panel",
    ownerSummary:
      "As the owner, start each day knowing cash, sales pipeline, and stock health before making decisions.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Today's priorities",
        items: [
          "Review open sales orders and overdue customer balances.",
          "Check which purchase orders are waiting for goods receipt.",
          "Confirm you are posting in the correct fiscal year.",
          "If new company: finish Setup checklist before live transactions.",
        ],
      },
      {
        category: "howToHandle",
        title: "Daily management rhythm",
        items: [
          "Morning: check dashboard + bank balances.",
          "Mid-day: approve orders, deliveries, and payments.",
          "End of day: reconcile cash received and stock movements.",
          "Weekly: run aged debtors and supplier payment schedule.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Grow with data you already have",
        items: [
          "Identify top 20% customers and offer loyalty pricing via Sales Groups.",
          "Use recurrent invoices for subscription or maintenance contracts.",
          "Track slow-moving stock with Inventory Item Status inquiry.",
          "Compare sales summary vs purchase costs for margin by product line.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner mindset",
        items: [
          "Separate operations (orders/delivery) from finance (invoice/payment).",
          "Never skip allocation — unpaid invoices distort your true cash position.",
          "Run System Diagnostics monthly; fix warnings before they become losses.",
        ],
      },
    ],
    path: "/dashboard",
  },
  {
    id: "biz-sales",
    pathPrefix: "/sales",
    businessArea: "Sales & Revenue",
    headline: "Turn quotes into cash predictably",
    ownerSummary:
      "Sales is not finished when the order is taken — revenue is real only after delivery, invoice, and payment.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "If you sell products or services",
        items: [
          "Define clear sales types (Retail, Wholesale, Export) with correct pricing.",
          "Set credit limits and status on every active customer.",
          "Train staff: Order → Delivery → Invoice → Payment — no shortcuts on invoice.",
          "Review Customer Transaction Inquiry weekly for overdue accounts.",
        ],
      },
      {
        category: "howToHandle",
        title: "Handling common sales situations",
        items: [
          "Walk-in sale: use Direct Invoice or Direct Delivery.",
          "B2B repeat customer: Sales Order then scheduled deliveries.",
          "Prepaid order: invoice prepaid amount first, final invoice when delivered.",
          "Returns: issue Customer Credit Note and allocate against invoice.",
          "Disputed amount: credit note + keep audit trail in comments/attachments.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Revenue growth ideas",
        items: [
          "Bundle slow items with bestsellers using Sales Kits.",
          "Assign sales persons and track performance by area.",
          "Send quotations from system and convert winners to orders quickly.",
          "Offer payment terms that improve cash flow (shorter terms for new clients).",
          "Automate monthly billing with Recurrent Invoices.",
        ],
      },
      {
        category: "ownerTips",
        title: "Protect margin and cash",
        items: [
          "Discount only with approval — check COGS vs selling price on each line.",
          "Do not deliver without stock or without credit approval on large accounts.",
          "Chase payments before accepting new large orders from slow payers.",
        ],
      },
    ],
  },
  {
    id: "biz-purchase",
    pathPrefix: "/purchase",
    businessArea: "Purchasing & Costs",
    headline: "Control spending before money leaves the bank",
    ownerSummary:
      "Good purchasing starts with what you need, not what suppliers push. Match PO, receipt, and invoice every time.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Purchasing discipline",
        items: [
          "Create PO only after internal need is confirmed (reorder level or sales order).",
          "Never pay supplier without matching PO → GRN → Invoice.",
          "Negotiate payment terms in supplier master before first order.",
          "Review Supplier Transaction Inquiry for duplicate or unmatched invoices.",
        ],
      },
      {
        category: "howToHandle",
        title: "How to handle supplier workflow",
        items: [
          "Regular stock: PO → Receive → Invoice → Pay on due date.",
          "Emergency buy: Direct GRN then invoice same day.",
          "Price dispute: hold payment, use Supplier Credit Note if needed.",
          "Partial delivery: receive partial GRN; keep PO open for balance.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Cost reduction ideas",
        items: [
          "Compare Purchasing Pricing across suppliers for same item.",
          "Consolidate orders to reduce freight and admin cost.",
          "Set reorder levels so you buy before stock-out, not after crisis.",
          "Review GRN vs invoice price variances monthly.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner controls",
        items: [
          "Split duties: one person orders, another receives, finance pays.",
          "Cap PO value per role using access permissions.",
          "Track payables aging — paying early loses cash; paying late loses trust.",
        ],
      },
    ],
  },
  {
    id: "biz-inventory",
    pathPrefix: "/itemsandinventory",
    businessArea: "Inventory & Stock",
    headline: "Stock is cash sitting on your shelf",
    ownerSummary:
      "Every unit in the warehouse ties up money. Balance availability with turnover — too much stock kills cash flow.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Inventory health checks",
        items: [
          "Set reorder levels on all active items.",
          "Assign correct inventory, COGS, and sales GL accounts on each item.",
          "Run Inventory Item Status report for dead and negative stock.",
          "Define at least one default location; use transfers between branches.",
        ],
      },
      {
        category: "howToHandle",
        title: "Stock problems and fixes",
        items: [
          "Physical count differs from system: Inventory Adjustment with reason.",
          "Wrong warehouse: Location Transfer, not adjustment.",
          "Damaged goods: adjust out with write-off; review insurance if large.",
          "Sales says out of stock but system shows qty: check location and reserved orders.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Inventory business ideas",
        items: [
          "ABC analysis: tight control on high-value items, simple rules on low-value.",
          "Use Standard Costs to see margin before you price.",
          "Foreign item codes for barcode scanning at counter.",
          "Sales kits to move complementary products together.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner advice",
        items: [
          "Count high-value stock monthly; full count quarterly.",
          "Shrinkage is a profit leak — investigate repeated adjustment patterns.",
          "Do not allow negative stock unless you accept risk of overselling.",
        ],
      },
    ],
  },
  {
    id: "biz-manufacturing",
    pathPrefix: "/manufacturing",
    businessArea: "Manufacturing",
    headline: "Produce what you sell — know your true product cost",
    ownerSummary:
      "Manufacturing profit = selling price minus real material, labour, and overhead. Cost work orders before pricing finished goods.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Production setup",
        items: [
          "Build accurate BOM for each finished product (include scrap allowance).",
          "Define work centres if you track capacity or labour.",
          "Release work orders only when raw materials are in stock.",
          "Cost every completed WO before updating sales pricing.",
        ],
      },
      {
        category: "howToHandle",
        title: "Production workflow",
        items: [
          "Plan: sales forecast → WO entry → material issue → produce → QC → stock in.",
          "Shortage on issue: purchase raw materials first or split WO batch.",
          "Rework: separate WO or adjustment — do not hide cost in finished goods.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Manufacturing growth",
        items: [
          "Use Where Used inquiry before discontinuing a raw material.",
          "Standardize BOM to reduce waste and training time.",
          "Offer made-to-order using sales order linked to WO.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner advice",
        items: [
          "If BOM cost > 70% of selling price, fix recipe or price before scaling.",
          "Track outstanding WOs — idle WOs tie up material and space.",
        ],
      },
    ],
  },
  {
    id: "biz-fixed-assets",
    pathPrefix: "/fixedassets",
    businessArea: "Fixed Assets",
    headline: "Protect long-term investments on your balance sheet",
    ownerSummary:
      "Vehicles, machinery, and equipment are assets — track them, depreciate correctly, and dispose with proper GL impact.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Asset management",
        items: [
          "Register every major purchase as a fixed asset item.",
          "Set depreciation method and useful life at purchase.",
          "Run Process Depreciation at each month/quarter end.",
          "Tag location for audit and insurance purposes.",
        ],
      },
      {
        category: "howToHandle",
        title: "Lifecycle handling",
        items: [
          "Purchase: Fixed Assets Purchase with supplier invoice link.",
          "Move between sites: Location Transfer.",
          "Scrap: Disposal with loss account.",
          "Sell: Fixed Assets Sale — recognize gain or loss properly.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Business ideas",
        items: [
          "Review asset register before insurance renewal.",
          "Replace high-maintenance assets when book value is low and downtime is high.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner advice",
        items: [
          "Capital vs expense: major upgrades are assets; small repairs are expenses.",
          "Keep purchase documents attached for tax and audit.",
        ],
      },
    ],
  },
  {
    id: "biz-banking",
    pathPrefix: "/bankingandgeneralledger",
    businessArea: "Finance & Cash",
    headline: "Cash flow is the heartbeat of your business",
    ownerSummary:
      "Profit on paper means nothing if the bank is empty. Reconcile, accrue, and read reports every month.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Financial control today",
        items: [
          "Reconcile all bank accounts to latest statement.",
          "Post all customer receipts and supplier payments for the week.",
          "Run Trial Balance — debits must equal credits.",
          "Review Profit & Loss vs last month for surprises.",
        ],
      },
      {
        category: "howToHandle",
        title: "Finance operations",
        items: [
          "Daily banking: record deposits and payments same day.",
          "Month-end: accrue unpaid expenses (Revenue/Cost Accruals).",
          "Year-end: close fiscal year only after reconciliation and stock count.",
          "Manual corrections: Journal Entry with clear memo — avoid silent edits.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Financial improvement ideas",
        items: [
          "Separate business and personal accounts — one bank account per entity.",
          "Use Budget Entry to set targets and compare actual vs plan.",
          "Aged customer analysis to reduce DSO (days sales outstanding).",
          "Renegotiate supplier terms to improve cash conversion cycle.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner advice",
        items: [
          "Watch three numbers weekly: bank balance, receivables overdue, payables due.",
          "Growth needs working capital — plan stock and credit before big sales push.",
          "Get accountant review of Balance Sheet quarterly.",
        ],
      },
    ],
  },
  {
    id: "biz-setup",
    pathPrefix: "/setup",
    businessArea: "Business Launch",
    headline: "Set the foundation before you scale",
    ownerSummary:
      "Rushing into transactions without setup causes costly rework. Invest 1–2 days in configuration — save months of errors.",
    blocks: [
      {
        category: "whatToDoNow",
        title: "Launch sequence for new business",
        items: [
          "1. Company profile, logo, currency, enable modules you need.",
          "2. Users, roles, and who can approve payments vs orders.",
          "3. Fiscal year and transaction numbering.",
          "4. Taxes and GL default accounts.",
          "5. Chart of accounts, bank accounts, items, customers, suppliers.",
          "6. System Diagnostics — fix all errors before first live invoice.",
        ],
      },
      {
        category: "howToHandle",
        title: "Choosing what to enable",
        items: [
          "Trading business: Sales + Purchase + Inventory + Banking.",
          "Service business: Sales + Banking (minimal inventory).",
          "Factory: add Manufacturing + Inventory.",
          "Asset-heavy: enable Fixed Assets.",
          "Project business: enable CostCenters for job costing.",
        ],
      },
      {
        category: "businessIdeas",
        title: "Business model ideas in ERP",
        items: [
          "Retail shop: POS + Direct Invoice + daily bank deposit.",
          "Distributor: PO bulk buy + sales order fulfillment + credit control.",
          "Contractor: CostCenters per project + accruals for WIP.",
          "SaaS/subscription: Recurrent Invoices + customer groups.",
        ],
      },
      {
        category: "ownerTips",
        title: "Owner launch advice",
        items: [
          "Pilot with one product line and one customer before full migration.",
          "Backup before go-live and before fiscal year close.",
          "Document your internal approval rules — ERP permissions should match them.",
        ],
      },
    ],
  },
];

const DEFAULT_ENTRY: BusinessConsultingEntry = {
  id: "biz-default",
  pathPrefix: "/",
  businessArea: "Business Operations",
  headline: "Build a business that runs on process, not memory",
  ownerSummary:
    "Use this ERP to document every sale, purchase, and payment. Owners win when the team follows the same workflow every day.",
  blocks: [
    {
      category: "whatToDoNow",
      title: "Start here",
      items: [
        "Open the module matching your task: Sales, Purchase, Inventory, or Banking.",
        "Use Transactions for daily work; Maintenance for master data.",
        "Check AI Tips tab for the next system action on this screen.",
      ],
    },
    {
      category: "howToHandle",
      title: "General business flow",
      items: [
        "Buy → Stock In → Sell → Deliver → Invoice → Collect cash → Pay suppliers.",
        "Every step should leave a trace in the system for audit and reporting.",
      ],
    },
    {
      category: "businessIdeas",
      title: "Ideas for any owner",
      items: [
        "Measure what matters: sales, gross margin, stock turnover, cash in bank.",
        "Review reports monthly; adjust pricing and purchasing from data.",
        "Automate repeat work (recurrent invoices, standard POs, templates).",
      ],
    },
    {
      category: "ownerTips",
      title: "Leadership habit",
      items: [
        "Spend 30 minutes weekly in Inquiries & Reports — not only in transactions.",
        "Delegate data entry but retain approval on payments and credit limits.",
      ],
    },
  ],
};

function normalizePath(pathname: string): string {
  if (pathname.endsWith("/") && pathname.length > 1) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function getBusinessConsulting(pathname: string): BusinessConsultingEntry {
  const normalized = normalizePath(pathname);

  let best: BusinessConsultingEntry | undefined;
  let bestLen = -1;

  for (const entry of ENTRIES) {
    const prefix = entry.pathPrefix;
    const matches =
      normalized === prefix || normalized.startsWith(`${prefix}/`);

    if (matches && prefix.length > bestLen) {
      best = entry;
      bestLen = prefix.length;
    }
  }

  return best ?? DEFAULT_ENTRY;
}

/** Short owner-focused "do this now" line for compact UI */
export function getOwnerActionNow(pathname: string): string {
  const entry = getBusinessConsulting(pathname);
  const block = entry.blocks.find((b) => b.category === "whatToDoNow");
  return block?.items[0] ?? entry.ownerSummary;
}

export const BUSINESS_MODEL_PLAYBOOK = [
  {
    model: "Retail store",
    setup: "Items, locations, sales types, POS, bank deposit daily",
    flow: "Direct invoice → customer payment → bank deposit",
    kpi: "Daily sales, stock turnover, cash in drawer vs system",
  },
  {
    model: "Wholesale / distribution",
    setup: "Credit limits, sales orders, multiple locations, purchasing pricing",
    flow: "PO → GRN → sales order → delivery → invoice → allocation",
    kpi: "Margin by product, DSO, slow stock",
  },
  {
    model: "Manufacturing",
    setup: "BOM, work centres, standard costs, WO workflow",
    flow: "Sales order → WO → issue → produce → deliver → invoice",
    kpi: "WO cost vs standard, material variance, on-time delivery",
  },
  {
    model: "Services / consulting",
    setup: "Minimal inventory, recurrent invoices, costCenters per project",
    flow: "Quotation → invoice (milestone) → payment → accruals",
    kpi: "Billable vs collected, WIP, project margin",
  },
  {
    model: "Import / trading",
    setup: "Multi-currency, GRN clearing, landed cost in pricing",
    flow: "PO → GRN → supplier invoice → sales pricing update → sell",
    kpi: "Exchange impact, landed cost, import lead time",
  },
];
