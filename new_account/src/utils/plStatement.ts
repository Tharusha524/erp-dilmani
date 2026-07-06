/** Structured P&L statement from backend ProfitAndLossStatementBuilder. */

export interface PlStatementLine {
  kind: "account" | "calculated" | "group" | "subtotal";
  account_code?: string;
  label?: string;
  account_type?: number;
  classId?: string;
  typeName?: string;
  period?: number;
  compareValue?: number;
  achievePercent?: string;
  bold?: boolean;
}

export interface PlStatementSection {
  key: string;
  title: string;
  lines: PlStatementLine[];
  subtotals: PlStatementLine[];
  groups?: Record<string, PlStatementLine[]>;
}

export interface PlStatementSummaryAmount {
  period: number;
  compare: number;
  achievePercent: string;
}

export interface PlStatement {
  sections: PlStatementSection[];
  summary: {
    sales: PlStatementSummaryAmount;
    costOfSales: PlStatementSummaryAmount;
    grossProfit: PlStatementSummaryAmount;
    otherIncome: PlStatementSummaryAmount;
    totalIncome: PlStatementSummaryAmount;
    totalExpenses: PlStatementSummaryAmount;
    totalCosts?: PlStatementSummaryAmount;
    calculatedReturn?: PlStatementSummaryAmount;
    netProfit: PlStatementSummaryAmount;
  };
}

export interface PlSearchResponse {
  rows: Record<string, unknown>[];
  statement?: PlStatement;
}
