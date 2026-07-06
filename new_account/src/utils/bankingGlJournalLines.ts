import {
  GlJournalLine,
  GlTransactionGroup,
  chartByCodeMap,
  pairGlLines,
  prefValue,
  resolveBankGlCode,
} from "./glJournalLinesCore";
import { parseJournalAmount } from "./journalAmount";
import { referencesEqual } from "./exactReference";

export type { GlJournalLine, GlTransactionGroup };

export const BANKING_TRANS_TYPE_LABELS: Record<number, string> = {
  0: "Journal Entry",
  1: "Bank Payment",
  2: "Bank Deposit",
  4: "Funds Transfer",
  12: "Customer Payment",
  22: "Supplier Payment",
};

export interface BankingFormLine {
  accountCode?: string;
  selectedAccountCode?: string;
  accountDescription?: string;
  debit?: string | number;
  credit?: string | number;
  amount?: string | number;
  memo?: string;
  dimension?: string;
}

function lineAccountCode(line: BankingFormLine): string {
  return String(line.selectedAccountCode || line.accountCode || "").trim();
}

function lineAmount(line: BankingFormLine): number {
  const direct = Number(line.amount);
  if (!Number.isNaN(direct) && direct > 0) return direct;
  const debit = Number(line.debit) || 0;
  const credit = Number(line.credit) || 0;
  return debit > 0 ? debit : credit > 0 ? credit : 0;
}

function bankGlFromId(bankAccounts: any[], bankAccountId: string | number | undefined, fallback: string): string {
  if (bankAccountId == null || bankAccountId === "") return fallback;
  const rec = (bankAccounts || []).find(
    (ba: any) =>
      String(ba.id) === String(bankAccountId) ||
      String(ba.bank_account_id) === String(bankAccountId) ||
      String(ba.account_code) === String(bankAccountId)
  );
  return (
    rec?.account_gl_code ??
    rec?.gl_code ??
    rec?.account_code ??
    fallback
  );
}

function pushLine(
  lines: GlJournalLine[],
  base: {
    journalDate: string;
    transaction: string;
    accountCode: string;
    debit: number;
    credit: number;
    memo: string;
    chartByCode: Map<string, { account_name?: string }>;
  }
) {
  const code = String(base.accountCode || "").trim();
  if (!code || (Math.abs(base.debit) < 0.001 && Math.abs(base.credit) < 0.001)) return;
  const rec = base.chartByCode.get(code);
  lines.push({
    id: `${base.transaction}-${code}-${lines.length}`,
    journalDate: base.journalDate,
    transaction: base.transaction,
    accountCode: code,
    accountName: rec?.account_name ? String(rec.account_name) : code,
    debit: base.debit,
    credit: base.credit,
    memo: base.memo,
  });
}

export function buildPaymentGlLines(params: {
  formLines: BankingFormLine[];
  bankAccounts: any[];
  bankAccountId?: string | number;
  chartByCode: Map<string, { account_name?: string }>;
  journalDate: string;
  transaction: string;
  defaultCashAccount: string;
  memo?: string;
}): GlJournalLine[] {
  const {
    formLines,
    bankAccounts,
    bankAccountId,
    chartByCode,
    journalDate,
    transaction,
    defaultCashAccount,
    memo,
  } = params;

  const bankGl = bankGlFromId(bankAccounts, bankAccountId, defaultCashAccount);
  const lines: GlJournalLine[] = [];
  let total = 0;

  (formLines || []).forEach((row) => {
    const code = lineAccountCode(row);
    const amt = lineAmount(row);
    if (!code || amt <= 0) return;
    total += amt;
    pushLine(lines, {
      journalDate,
      transaction,
      accountCode: code,
      debit: amt,
      credit: 0,
      memo: row.memo || memo || "Payment allocation",
      chartByCode,
    });
  });

  if (total > 0) {
    pushLine(lines, {
      journalDate,
      transaction,
      accountCode: bankGl,
      debit: 0,
      credit: total,
      memo: memo || "Bank payment",
      chartByCode,
    });
  }

  return lines;
}

export function buildDepositGlLines(params: {
  formLines: BankingFormLine[];
  bankAccounts: any[];
  bankAccountId?: string | number;
  chartByCode: Map<string, { account_name?: string }>;
  journalDate: string;
  transaction: string;
  defaultCashAccount: string;
  memo?: string;
}): GlJournalLine[] {
  const {
    formLines,
    bankAccounts,
    bankAccountId,
    chartByCode,
    journalDate,
    transaction,
    defaultCashAccount,
    memo,
  } = params;

  const bankGl = bankGlFromId(bankAccounts, bankAccountId, defaultCashAccount);
  const lines: GlJournalLine[] = [];
  let total = 0;

  (formLines || []).forEach((row) => {
    const code = lineAccountCode(row);
    const amt = lineAmount(row);
    if (!code || amt <= 0) return;
    total += amt;
    pushLine(lines, {
      journalDate,
      transaction,
      accountCode: code,
      debit: 0,
      credit: amt,
      memo: row.memo || memo || "Deposit allocation",
      chartByCode,
    });
  });

  if (total > 0) {
    pushLine(lines, {
      journalDate,
      transaction,
      accountCode: bankGl,
      debit: total,
      credit: 0,
      memo: memo || "Bank deposit",
      chartByCode,
    });
  }

  return lines;
}

export function buildManualJournalGlLines(params: {
  formLines: BankingFormLine[];
  chartByCode: Map<string, { account_name?: string }>;
  journalDate: string;
  transaction: string;
}): GlJournalLine[] {
  const { formLines, chartByCode, journalDate, transaction } = params;
  const lines: GlJournalLine[] = [];

  (formLines || []).forEach((row) => {
    const code = lineAccountCode(row);
    const debit = parseJournalAmount(row.debit);
    const credit = parseJournalAmount(row.credit);
    if (!code || (Math.abs(debit) < 0.001 && Math.abs(credit) < 0.001)) return;
    pushLine(lines, {
      journalDate,
      transaction,
      accountCode: code,
      debit,
      credit,
      memo: row.memo || "Journal line",
      chartByCode,
    });
  });

  return lines;
}

export function nextBankTransNo(bankTransList: any[], transType: number): number {
  const nums = (bankTransList || [])
    .filter((b: any) => Number(b.type) === transType)
    .map((b: any) => Number(b.trans_no))
    .filter((n: number) => !Number.isNaN(n) && n > 0);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

export function buildBankingGlJournalGroups(params: {
  bankTransList: any[];
  journals: any[];
  chartMasters: any[];
  sysPrefs: { name: string; value: string }[];
  bankAccounts: any[];
  reference?: string;
  trans_no?: number | string | null;
  trans_type?: number | null;
  formLines?: BankingFormLine[];
  bankAccountId?: string | number;
  transactionKind?: "payment" | "deposit" | "journal";
  date?: string;
}): GlTransactionGroup[] {
  const {
    bankTransList,
    journals,
    chartMasters,
    sysPrefs,
    bankAccounts,
    reference,
    trans_no,
    trans_type,
    formLines,
    bankAccountId,
    transactionKind,
    date,
  } = params;

  const chartByCode = chartByCodeMap(chartMasters);
  const defaultCash = prefValue(sysPrefs, "defaultCashAccount", "1060");
  const receivable = prefValue(sysPrefs, "receivableAccount", "1200");
  const refKey = reference ? String(reference) : "";

  const relatedBank = (bankTransList || []).filter((bt: any) => {
    if (trans_no != null && trans_type != null) {
      return Number(bt.trans_no) === Number(trans_no) && Number(bt.type) === Number(trans_type);
    }
    if (refKey) {
      const bankRef = String(bt.ref ?? "").trim();
      if (bankRef && referencesEqual(bankRef, refKey)) {
        return true;
      }
    }
    return false;
  });

  const relatedJournals = (journals || []).filter((j: any) => {
    if (refKey) {
      const journalRef = String(j.reference ?? "").trim();
      if (
        journalRef &&
        referencesEqual(journalRef, refKey)
      ) {
        return true;
      }
    }
    if (trans_no != null && trans_type != null) {
      return Number(j.trans_no) === Number(trans_no) && Number(j.type) === Number(trans_type);
    }
    return false;
  });

  const groups: GlTransactionGroup[] = [];
  const seen = new Set<string>();

  for (const bt of relatedBank) {
    const transType = Number(bt.type);
    const transNo = Number(bt.trans_no);
    const key = `${transType}-${transNo}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tranDate = bt.trans_date ? String(bt.trans_date).split("T")[0] : date || "";
    const ref = bt.ref ?? reference ?? "";
    const title = BANKING_TRANS_TYPE_LABELS[transType] ?? `Bank transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const amount = Math.abs(Number(bt.amount) || 0);
    const bankGl = resolveBankGlCode(bankTransList, bankAccounts, transType, transNo, defaultCash);

    let lines: GlJournalLine[] = [];

    if (formLines && formLines.length > 0 && transactionKind === "payment") {
      lines = buildPaymentGlLines({
        formLines,
        bankAccounts,
        bankAccountId: bankAccountId ?? bt.bank_act,
        chartByCode,
        journalDate: tranDate,
        transaction: transactionLabel,
        defaultCashAccount: defaultCash,
        memo: ref,
      });
    } else if (formLines && formLines.length > 0 && transactionKind === "deposit") {
      lines = buildDepositGlLines({
        formLines,
        bankAccounts,
        bankAccountId: bankAccountId ?? bt.bank_act,
        chartByCode,
        journalDate: tranDate,
        transaction: transactionLabel,
        defaultCashAccount: defaultCash,
        memo: ref,
      });
    } else if (transType === 1 && amount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: receivable,
          creditAccount: bankGl,
          amount,
          memo: ref || "Bank payment",
          chartByCode,
        })
      );
    } else if (transType === 2 && amount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: bankGl,
          creditAccount: receivable,
          amount,
          memo: ref || "Bank deposit",
          chartByCode,
        })
      );
    } else if (transType === 4 && amount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: bankGl,
          creditAccount: defaultCash,
          amount,
          memo: ref || "Funds transfer",
          chartByCode,
        })
      );
    }

    if (lines.length > 0) {
      groups.push({
        transType,
        transNo,
        reference: ref,
        tranDate,
        title,
        lines,
      });
    }
  }

  for (const j of relatedJournals) {
    const transType = Number(j.type);
    const transNo = Number(j.trans_no);
    const key = `j-${transType}-${transNo}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tranDate = j.tran_date ? String(j.tran_date).split("T")[0] : date || "";
    const ref = j.reference ?? reference ?? "";
    const title = BANKING_TRANS_TYPE_LABELS[transType] ?? `Journal type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;

    let lines: GlJournalLine[] = [];

    if (formLines && formLines.length > 0 && (transactionKind === "journal" || transType === 0)) {
      lines = buildManualJournalGlLines({
        formLines,
        chartByCode,
        journalDate: tranDate,
        transaction: transactionLabel,
      });
    } else {
      const amount = Math.abs(Number(j.amount) || 0);
      if (amount > 0) {
        lines.push(
          ...pairGlLines({
            journalDate: tranDate,
            transaction: transactionLabel,
            debitAccount: defaultCash,
            creditAccount: receivable,
            amount,
            memo: ref || title,
            chartByCode,
          })
        );
      }
    }

    if (lines.length > 0) {
      groups.push({
        transType,
        transNo,
        reference: ref,
        tranDate,
        title,
        lines,
      });
    }
  }

  if (groups.length === 0 && formLines && formLines.length > 0) {
    const tranDate = date || new Date().toISOString().split("T")[0];
    const ref = refKey || "—";
    let lines: GlJournalLine[] = [];
    let title = "Banking transaction";

    if (transactionKind === "payment") {
      title = "Bank Payment";
      lines = buildPaymentGlLines({
        formLines,
        bankAccounts,
        bankAccountId,
        chartByCode,
        journalDate: tranDate,
        transaction: title,
        defaultCashAccount: defaultCash,
        memo: ref,
      });
    } else if (transactionKind === "deposit") {
      title = "Bank Deposit";
      lines = buildDepositGlLines({
        formLines,
        bankAccounts,
        bankAccountId,
        chartByCode,
        journalDate: tranDate,
        transaction: title,
        defaultCashAccount: defaultCash,
        memo: ref,
      });
    } else if (transactionKind === "journal") {
      title = "Journal Entry";
      lines = buildManualJournalGlLines({
        formLines,
        chartByCode,
        journalDate: tranDate,
        transaction: title,
      });
    }

    if (lines.length > 0) {
      groups.push({
        transType: trans_type != null ? Number(trans_type) : transactionKind === "deposit" ? 2 : transactionKind === "payment" ? 1 : 0,
        transNo: trans_no != null ? Number(trans_no) : 0,
        reference: ref,
        tranDate,
        title,
        lines,
      });
    }
  }

  return groups;
}
