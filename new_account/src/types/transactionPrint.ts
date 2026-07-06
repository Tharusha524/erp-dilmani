import type { ReactNode } from "react";

export type TransactionPrintMetaField = {
  label: string;
  value: ReactNode;
};

export type TransactionPrintColumn = {
  id: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string | number;
};

export type TransactionPrintLine = Record<string, string | number | null | undefined>;

export type TransactionPrintTaxLine = {
  label: string;
  amount: number;
};

export type TransactionPrintTotals = {
  subtotal?: number;
  taxLines?: { label: string; amount: number }[];
  taxIncluded?: boolean;
  total: number;
  currency?: string;
};

export type TransactionPrintTemplateProps = {
  documentType: string;
  documentNumber?: string | number;
  reference?: string;
  documentDate?: string;
  dueDate?: string;
  currency?: string;
  partyLabel?: string;
  partyName?: string;
  partyLines?: string[];
  partyFields?: TransactionPrintMetaField[];
  documentFields?: TransactionPrintMetaField[];
  columns: TransactionPrintColumn[];
  lines: TransactionPrintLine[];
  totals: TransactionPrintTotals;
  comments?: string;
  footerNote?: string;
};
