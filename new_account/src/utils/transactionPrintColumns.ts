import type { TransactionPrintColumn } from "../types/transactionPrint";

/** Standard item line columns for sales/purchase documents. */
export const STANDARD_ITEM_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "item", label: "Item", width: "12%" },
  { id: "description", label: "Description" },
  { id: "quantity", label: "Qty", align: "right", width: "8%" },
  { id: "unit", label: "Unit", width: "8%" },
  { id: "price", label: "Unit Price", align: "right", width: "12%" },
  { id: "discount", label: "Disc.", align: "right", width: "8%" },
  { id: "total", label: "Line Total", align: "right", width: "12%" },
];

/** Purchase invoice line columns (includes GRN batch reference). */
export const PURCHASE_ITEM_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "delivery", label: "GRN", width: "10%" },
  { id: "item", label: "Item", width: "12%" },
  { id: "description", label: "Description" },
  { id: "quantity", label: "Qty", align: "right", width: "10%" },
  { id: "price", label: "Unit Price", align: "right", width: "12%" },
  { id: "total", label: "Line Total", align: "right", width: "12%" },
];

/** Purchase order / GRN receipt lines. */
export const PURCHASE_ORDER_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "item", label: "Item", width: "12%" },
  { id: "description", label: "Description" },
  { id: "quantity", label: "Qty", align: "right", width: "8%" },
  { id: "unit", label: "Unit", width: "8%" },
  { id: "price", label: "Unit Price", align: "right", width: "12%" },
  { id: "total", label: "Line Total", align: "right", width: "12%" },
];

/** Delivery packing slip — quantities only, no pricing. */
export const PACKING_SLIP_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "item", label: "Item", width: "14%" },
  { id: "description", label: "Description" },
  { id: "quantity", label: "Qty", align: "right", width: "10%" },
  { id: "unit", label: "Unit", width: "10%" },
];

/** Payment / allocation receipt lines. */
export const ALLOCATION_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "type", label: "Type", width: "14%" },
  { id: "number", label: "#", width: "10%" },
  { id: "ref", label: "Reference" },
  { id: "date", label: "Date", width: "12%" },
  { id: "total", label: "Doc Total", align: "right", width: "12%" },
  { id: "allocated", label: "This Allocation", align: "right", width: "14%" },
];

/** GL journal entry lines. */
export const GL_JOURNAL_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "date", label: "Date", width: "11%" },
  { id: "account", label: "Account", width: "11%" },
  { id: "description", label: "Account Name" },
  { id: "dimension", label: "Dimension", width: "10%" },
  { id: "debit", label: "Debit", align: "right", width: "11%" },
  { id: "credit", label: "Credit", align: "right", width: "11%" },
  { id: "memo", label: "Memo", width: "14%" },
];

/** Work order BOM / requirement lines. */
export const WORK_ORDER_REQUIREMENT_PRINT_COLUMNS: TransactionPrintColumn[] = [
  { id: "item", label: "Component", width: "14%" },
  { id: "description", label: "Description" },
  { id: "location", label: "Location", width: "12%" },
  { id: "workCentre", label: "Work Centre", width: "12%" },
  { id: "quantity", label: "Unit Qty", align: "right", width: "10%" },
  { id: "total", label: "Total Qty", align: "right", width: "10%" },
  { id: "issued", label: "Issued", align: "right", width: "10%" },
];

export const DOCUMENT_PRINT_TYPES = {
  quotation: "Quotation",
  salesOrder: "Sales Order",
  taxInvoice: "Tax Invoice",
  deliveryNote: "Delivery Note",
  creditNote: "Credit Note",
  receipt: "Receipt",
  purchaseOrder: "Purchase Order",
  grn: "Goods Received",
  supplierInvoice: "Supplier Invoice",
  supplierCredit: "Supplier Credit Note",
  supplierPayment: "Remittance Advice",
  journalEntry: "Journal Entry",
  workOrder: "Work Order",
} as const;
