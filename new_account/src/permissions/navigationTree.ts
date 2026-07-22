// Permission checklist tree that mirrors the REAL sidebar navigation:
// Module (sidebar item) -> Submenu (Transactions/Inquiries and Reports/
// Maintenance/...) -> Page (the actual card/route a user opens).
//
// Each page has its OWN distinct permission ID (wired into that page's
// specific route in Routes.tsx), so checking one page never grants access
// to a different page. Where a page previously shared its parent/hub's ID
// with several other pages, it now points at either an existing-but-unused
// PERMISSION_ID_MAP entry that already matched it semantically, or a newly
// added entry (see the bottom of ./map.ts) minted just for that page.
import PERMISSION_ID_MAP from "./map";

export interface NavPage {
  label: string;
  id: number;
}

export interface NavSubmenu {
  label: string;
  pages: NavPage[];
}

export interface NavModule {
  label: string;
  submenus: NavSubmenu[];
}

const id = (key: string): number => PERMISSION_ID_MAP[key];

export const NAVIGATION_PERMISSION_TREE: NavModule[] = [
  {
    label: "Sales",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Sales Quotation Entry", id: id("Sales quotations") },
          { label: "Sales Order Entry", id: id("Sales orders edition") },
          { label: "Direct Delivery", id: id("Direct sales delivery entry") },
          { label: "Direct Invoice", id: id("Direct sales invoice entry") },
          { label: "Delivery Against Sales Orders", id: id("Sales deliveries edition") },
          { label: "Invoice Against Sales Delivery", id: id("Sales invoices edition") },
          { label: "Invoice Prepaid Orders", id: id("Invoice prepaid orders") },
          { label: "Template Delivery", id: id("Sales templates") },
          { label: "Template Invoice", id: id("Sales template invoice") },
          { label: "Create and Print Recurrent Invoices", id: id("Recurrent invoices definitions") },
          { label: "Customer Payments", id: id("Customer payments entry") },
          { label: "Customer Credit Notes", id: id("Sales credit notes against invoice") },
          { label: "Allocate Customer Payments or Credit Notes", id: id("Customer payments allocation") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Sales Quotation Inquiry", id: id("Sales Related Reports") },
          { label: "Sales Order Inquiry", id: id("Sales order inquiry") },
          { label: "Customer Transaction Inquiry", id: id("Customer transaction inquiry") },
          { label: "Customer Allocation Inquiry", id: id("Customer allocation inquiry") },
          { label: "Customer and Sales Reports", id: id("Customer and sales reports") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Add and Manage Customers", id: id("Sales customer and branches changes") },
          { label: "Customer Branches", id: id("Customer branches maintenance") },
          { label: "Sales Groups", id: id("Sales groups changes") },
          { label: "Recurrent Invoices", id: id("Recurrent invoices maintenance") },
          { label: "Sales Types", id: id("Sales types") },
          { label: "Sales Persons", id: id("Sales staff maintenance") },
          { label: "Sales Areas", id: id("Sales areas maintenance") },
          { label: "Credit Status Setup", id: id("Credit status definitions changes") },
        ],
      },
    ],
  },
  {
    label: "Purchase",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Purchase Order Entry", id: id("Purchase order entry") },
          { label: "Outstanding Purchase Orders Maintenance", id: id("Outstanding purchase orders maintenance") },
          { label: "Receive Purchase Order Items", id: id("Purchase receive") },
          { label: "Direct GRN", id: id("Direct GRN entry") },
          { label: "Direct Supplier Invoice", id: id("Direct supplier invoice entry") },
          { label: "Payment to Suppliers", id: id("Supplier payments") },
          { label: "Supplier Invoice", id: id("Supplier invoices") },
          { label: "Supplier Credit Notes", id: id("Supplier credit notes") },
          { label: "Allocate Supplier Payments or Credit Notes", id: id("Supplier payments allocations") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Purchase Orders Inquiry", id: id("Purchase Analytics") },
          { label: "Supplier Transaction Inquiry", id: id("Supplier analytical reports") },
          { label: "Supplier Allocation Inquiry", id: id("Supplier allocation inquiry") },
          { label: "Supplier & Purchasing Reports", id: id("Supplier payments report") },
        ],
      },
      {
        label: "Maintenance",
        pages: [{ label: "Suppliers", id: id("Suppliers changes") }],
      },
    ],
  },
  {
    label: "Item and inventory",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Inventory Location Transfer", id: id("Inventory location transfers") },
          { label: "Inventory Adjustments", id: id("Inventory adjustments") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Inventory Item Movements", id: id("Items analytical reports and inquiries") },
          { label: "Inventory Item Status", id: id("Inventory item status inquiry") },
          { label: "Inventory Reports", id: id("Inventory reports") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Items", id: id("Stock items add/edit") },
          { label: "Foreign Item Codes", id: id("Foreign item codes entry") },
          { label: "Sales Kits", id: id("Sales kits") },
          { label: "Item Categories", id: id("Item categories") },
          { label: "Inventory Locations", id: id("Inventory locations changes") },
          { label: "Units of Measure", id: id("Units of measure") },
          { label: "Reorder Levels", id: id("Reorder levels") },
        ],
      },
      {
        label: "Pricing and Costs",
        pages: [
          { label: "Sales Pricing", id: id("Sales prices edition") },
          { label: "Purchasing Pricing", id: id("Purchase price changes") },
          { label: "Standard Costs", id: id("Item standard costs") },
        ],
      },
    ],
  },
  {
    label: "Manufacturing",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Work Order Entry", id: id("Work order entry") },
          { label: "Outstanding Work Orders", id: id("Work order releases") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Costed Bill of Material Inquiry", id: id("Manufacturing cost inquiry") },
          { label: "Inventory Item Where Used Inquiry", id: id("Inventory item where used inquiry") },
          { label: "Work Order Inquiry", id: id("Work order analytical reports and inquiries") },
          { label: "Manufacturing Reports", id: id("Manufacturing reports") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Bills of Materials", id: id("Bill of Materials") },
          { label: "Work Centers", id: id("Manufacture work centres") },
        ],
      },
    ],
  },
  {
    label: "Fixed Assets",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Fixed Assets Purchase", id: id("Fixed Assets Operations") },
          { label: "Fixed Assets Location Transfer", id: id("Fixed Asset location transfers") },
          { label: "Fixed Assets Disposal", id: id("Fixed Asset disposals") },
          { label: "Fixed Assets Sale", id: id("Fixed assets sale") },
          { label: "Process Depreciation", id: id("Depreciation") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Fixed Asset Movements", id: id("Fixed Assets Analytics") },
          { label: "Fixed Assets Inquiry", id: id("Fixed Asset analytical reports and inquiries") },
          { label: "Fixed Asset Reports", id: id("Fixed asset reports") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Fixed Assets", id: id("Fixed Asset items add/edit") },
          { label: "Fixed Assets Locations", id: id("Fixed assets locations maintenance") },
          { label: "Fixed Assets Categories", id: id("Fixed Asset categories") },
          { label: "Fixed Assets Classes", id: id("Fixed Asset classes") },
        ],
      },
    ],
  },
  {
    label: "CostCenter",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Cost Center Entry", id: id("CostCenter entry") },
          { label: "Outstanding Cost Centers", id: id("CostCenter view") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Cost Center Inquiry", id: id("CostCenter view") },
          { label: "Cost Center Reports", id: id("CostCenters") },
        ],
      },
      {
        label: "Maintenance",
        pages: [{ label: "Cost Center Tags", id: id("CostCenter tags") }],
      },
    ],
  },
  {
    label: "Banking And General ledger",
    submenus: [
      {
        label: "Transactions",
        pages: [
          { label: "Payments", id: id("Bank payments") },
          { label: "Deposits", id: id("Bank deposits") },
          { label: "Bank Account Transfers", id: id("Bank account transfers") },
          { label: "Journal Entry", id: id("Journal entries to bank related accounts") },
          { label: "Budget Entry", id: id("Budget edition") },
          { label: "Reconcile Bank Account", id: id("Bank reconciliation") },
          { label: "Revenue / Cost Accruals", id: id("Revenue / Cost Accruals") },
        ],
      },
      {
        label: "Inquiries and Reports",
        pages: [
          { label: "Journal Inquiry", id: id("GL analytical reports and inquiries") },
          { label: "GL Inquiry", id: id("GL inquiry") },
          { label: "Bank Account Inquiry", id: id("Bank reports and inquiries") },
          { label: "Tax Inquiry", id: id("Tax reports and inquiries") },
          { label: "Trial Balance", id: id("Trial balance inquiry") },
          { label: "Balance Sheet Drilldown", id: id("Balance sheet drilldown") },
          { label: "Profit and Loss Drilldown", id: id("Profit and loss drilldown") },
          { label: "Banking Reports", id: id("Banking & GL Analytics") },
          { label: "General Ledger Reports", id: id("GL reports and inquiries") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Bank Accounts", id: id("Bank accounts") },
          { label: "Quick Entries", id: id("Quick GL entry definitions") },
          { label: "Account Tags", id: id("GL Account tags") },
          { label: "Currencies", id: id("Currencies") },
          { label: "Exchange Rates", id: id("Exchange rate table changes") },
          { label: "GL Accounts", id: id("GL accounts edition") },
          { label: "GL Account Groups", id: id("GL account groups") },
          { label: "Account Types (GL)", id: id("Company GL setup") },
          { label: "GL Account Classes", id: id("GL account classes") },
          { label: "Closing GL Transactions", id: id("Banking & GL Configuration") },
          { label: "Revaluation of Currency Accounts", id: id("Revaluation of currency accounts") },
        ],
      },
    ],
  },
  {
    label: "Setup",
    submenus: [
      {
        label: "Company Setup",
        pages: [
          { label: "Company Setup", id: id("Company parameters") },
          { label: "User Account Setup", id: id("Users setup") },
          { label: "Access Setup", id: id("Access levels edition") },
          { label: "Department Setup", id: id("Department setup page") },
          { label: "Transaction References", id: id("Stock transactions view") },
          { label: "Taxes", id: id("Tax rates") },
          { label: "Tax Groups", id: id("Tax groups") },
          { label: "Item Tax Types", id: id("Item tax type definitions") },
          { label: "System and General GL Setup", id: id("Company GL setup") },
          { label: "Email Setup", id: id("Email setup page") },
          { label: "Login IP Restriction", id: id("Login IP restriction page") },
          { label: "Fiscal Years", id: id("Fiscal years maintenance") },
          { label: "User Login Activity", id: id("User login activity page") },
        ],
      },
      {
        label: "Miscellaneous",
        pages: [
          { label: "Payment Terms", id: id("Payment terms") },
          { label: "Shipping Company", id: id("Shipping ways") },
          { label: "Point of Sale", id: id("Point of Sale definitions") },
          { label: "Contact Categories", id: id("Contact categories") },
        ],
      },
      {
        label: "Maintenance",
        pages: [
          { label: "Void a Transaction", id: id("Voiding transactions") },
          { label: "View or Print Transaction", id: id("Common view/print transactions interface") },
          { label: "Attach Documents", id: id("Attaching documents") },
          { label: "System Diagnostics", id: id("System diagnostics page") },
          { label: "Backup and Restore", id: id("Database backup/restore") },
          { label: "User Login Activity", id: id("User login activity page") },
        ],
      },
    ],
  },
];

export default NAVIGATION_PERMISSION_TREE;
