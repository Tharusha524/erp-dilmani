import { isJournalCreditNormalDisplay, type ChartGroupMeta } from "./trialAccountBalance";

/** Parse amount text; keeps sign for journal +/- entry. */
export function parseJournalAmount(value: string | number | undefined): number {
  if (value === "" || value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** +amount → debit; −amount → credit (existing gl_trans columns). */
export function signedAmountToDebitCredit(amount: number): { debit: number; credit: number } {
  if (Math.abs(amount) < 0.001) {
    return { debit: 0, credit: 0 };
  }
  if (amount > 0) {
    return { debit: amount, credit: 0 };
  }
  return { debit: 0, credit: Math.abs(amount) };
}

/** Stored debit/credit → signed amount for the entry field. */
export function debitCreditToSignedAmount(debit: number, credit: number): string {
  if (debit > 0) return String(debit);
  if (credit > 0) return String(-credit);
  if (credit < 0) return String(credit);
  if (debit < 0) return String(debit);
  return "";
}

/**
 * Normalize one line for GL: −Debit → Credit; −Credit → Debit.
 */
export function normalizeJournalLineAmounts(
  rawDebit: string | number | undefined,
  rawCredit: string | number | undefined
): { debit: number; credit: number } {
  let debit = parseJournalAmount(rawDebit);
  let credit = parseJournalAmount(rawCredit);

  if (debit < 0) {
    credit += Math.abs(debit);
    debit = 0;
  }
  if (credit < 0) {
    debit += Math.abs(credit);
    credit = 0;
  }

  return { debit, credit };
}

/** Sum of Debit column and Credit column (credit includes negatives). */
export function journalColumnTotals(
  rows: Array<{ debit?: string | number; credit?: string | number }>
): { debitTotal: number; creditTotal: number; difference: number } {
  let debitTotal = 0;
  let creditTotal = 0;
  rows.forEach((row) => {
    debitTotal += parseJournalAmount(row.debit);
    creditTotal += parseJournalAmount(row.credit);
  });
  return {
    debitTotal,
    creditTotal,
    difference: debitTotal - creditTotal,
  };
}

/** Posted GL for bank/purchase lines: positive Debit OR Credit only. */
export function normalizeGlPostingDebitCredit(
  debit: number | string | undefined,
  credit: number | string | undefined
): { debit: number; credit: number } {
  return normalizeJournalLineAmounts(debit, credit);
}

/**
 * Posted gl_trans → Journal Entry form columns (supports −Credit / −Debit like entry screen).
 */
export function postedGlToJournalEntryColumns(
  postedDebit: number | string | undefined,
  postedCredit: number | string | undefined,
  accountType?: number | string,
  chartGroupMeta?: Map<number, ChartGroupMeta>
): { debit: number; credit: number } {
  const d = parseJournalAmount(postedDebit);
  const c = parseJournalAmount(postedCredit);
  const type = Number(accountType) || 0;

  // Posted debit on liability/income (not equity): was −Credit in the entry form.
  if (d > 0.001 && c <= 0.001) {
    if (isJournalCreditNormalDisplay(type, chartGroupMeta)) {
      return { debit: 0, credit: -d };
    }
    return { debit: d, credit: 0 };
  }

  // Posted credit always stays in the Credit column (opening balances, payables, etc.).
  if (c > 0.001 && d <= 0.001) {
    return { debit: 0, credit: c };
  }

  return { debit: d, credit: c };
}

/** Display amount in Journal Entry / GL Postings journal view (− allowed). */
export function formatJournalColumnAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseJournalAmount(value) : Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.001) return "—";
  const abs = Math.abs(n).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `-${abs}` : abs;
}

/** Balanced when Σ Debit column = Σ Credit column (e.g. 200 = 200 + (−100) + 100). */
export function isJournalColumnBalanced(
  rows: Array<{ debit?: string | number; credit?: string | number }>
): boolean {
  const { difference } = journalColumnTotals(rows);
  return Math.abs(difference) <= 0.01;
}
