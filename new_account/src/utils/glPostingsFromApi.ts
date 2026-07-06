import { GlTransRow } from "../api/GlTrans/GlTransApi";
import { GlJournalLine, GlTransactionGroup } from "./glJournalLinesCore";
import {
  normalizeGlPostingDebitCredit,
  postedGlToJournalEntryColumns,
} from "./journalAmount";
import type { ChartGroupMeta } from "./trialAccountBalance";

function groupKey(row: GlTransRow): string {
  const type = String(row.trans_type ?? "");
  const no = row.type_no != null ? String(row.type_no) : String(row.reference ?? "");
  return `${type}-${no}`;
}

export function glTransRowsToGroups(
  rows: GlTransRow[],
  chartGroupMeta?: Map<number, ChartGroupMeta>
): GlTransactionGroup[] {
  if (!rows.length) return [];

  const grouped = new Map<string, GlTransactionGroup>();

  rows.forEach((row, index) => {
    const key = groupKey(row);
    const transType = Number(row.trans_type) || 0;
    const transNo = row.type_no != null ? Number(row.type_no) : 0;
    const tranDate = row.date ? String(row.date).split("T")[0] : "";
    const ref = row.reference ? String(row.reference) : "";
    const title = row.type_label ? String(row.type_label) : `Transaction type ${transType}`;
    const transactionLabel = transNo > 0 ? `${title} #${transNo}` : title;

    const accountCode = String(row.account_code ?? "").trim();
    const isJournal = Number(row.trans_type) === 0;
    const { debit, credit } = isJournal
      ? postedGlToJournalEntryColumns(row.debit, row.credit, row.account_type, chartGroupMeta)
      : normalizeGlPostingDebitCredit(row.debit, row.credit);
    if (!accountCode || (Math.abs(debit) < 0.001 && Math.abs(credit) < 0.001)) return;

    const line: GlJournalLine = {
      id: String(row.id ?? `${key}-${index}`),
      journalDate: tranDate,
      transaction: transactionLabel,
      accountCode,
      accountName: String(row.account_name ?? accountCode),
      debit,
      credit,
      memo: String(row.memo ?? ""),
    };

    const existing = grouped.get(key);
    if (existing) {
      existing.lines.push(line);
      return;
    }

    grouped.set(key, {
      transType,
      transNo,
      reference: ref,
      tranDate,
      title,
      lines: [line],
    });
  });

  return Array.from(grouped.values());
}
