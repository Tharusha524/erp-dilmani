import {
  GlJournalLine,
  GlTransactionGroup,
  chartByCodeMap,
  flattenGlLines,
  pairGlLines,
  prefValue,
  resolveBankGlCode,
} from "./glJournalLinesCore";
import { referencesEqual } from "./exactReference";

export type { GlJournalLine, GlTransactionGroup };
export { flattenGlLines };

export const TRANS_TYPE_LABELS: Record<number, string> = {
  0: "Journal Entry",
  10: "Sales Invoice",
  11: "Customer Credit Note",
  12: "Customer Payment",
  13: "Delivery Note",
  30: "Sales Order",
};

export function buildSalesGlJournalGroups(params: {
  debtorTransList: any[];
  journals: any[];
  chartMasters: any[];
  sysPrefs: { name: string; value: string }[];
  bankAccounts: any[];
  bankTransList: any[];
  reference?: string;
  orderNo?: number | string | null;
  transNo?: number | string | null;
  transType?: number | string | null;
}): GlTransactionGroup[] {
  const {
    debtorTransList,
    journals,
    chartMasters,
    sysPrefs,
    bankAccounts,
    bankTransList,
    reference,
    orderNo,
    transNo,
    transType,
  } = params;

  const receivable = prefValue(sysPrefs, "receivableAccount", "1200");
  const sales = prefValue(sysPrefs, "salesAccount", "4010");
  const inventory = prefValue(sysPrefs, "inventoryAccount", "1510");
  const cogs = prefValue(sysPrefs, "cogsAccount", "5010");
  const chartByCode = chartByCodeMap(chartMasters);

  const refKey = reference ? String(reference) : "";
  const orderKey = orderNo != null && orderNo !== "" ? Number(orderNo) : null;
  const transNoKey = transNo != null && transNo !== "" ? Number(transNo) : null;
  const transTypeKey = transType != null && transType !== "" ? Number(transType) : null;

  const related = (debtorTransList || []).filter((dt: any) => {
    if (transNoKey != null && !Number.isNaN(transNoKey)) {
      if (Number(dt.trans_no) !== transNoKey) return false;
      if (
        transTypeKey != null &&
        !Number.isNaN(transTypeKey) &&
        Number(dt.trans_type) !== transTypeKey
      ) {
        return false;
      }
      return true;
    }
    if (refKey) {
      const rowRef = String(dt.reference ?? "").trim();
      if (rowRef && referencesEqual(rowRef, refKey)) {
        return true;
      }
    }
    if (orderKey != null && !Number.isNaN(orderKey) && Number(dt.order_no) === orderKey) return true;
    return false;
  });

  const typesOrder = [10, 11, 13, 12];
  const sorted = [...related].sort(
    (a, b) =>
      typesOrder.indexOf(Number(a.trans_type)) - typesOrder.indexOf(Number(b.trans_type)) ||
      Number(a.trans_no) - Number(b.trans_no)
  );

  const groups: GlTransactionGroup[] = [];
  const matchedJournalKeys = new Set<string>();

  for (const dt of sorted) {
    const transType = Number(dt.trans_type);
    const transNo = Number(dt.trans_no);
    const tranDate = dt.tran_date ? String(dt.tran_date).split("T")[0] : "";
    const ref = dt.reference ?? reference ?? "";
    const title = TRANS_TYPE_LABELS[transType] ?? `Transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const amount = Number(dt.ov_amount ?? dt.alloc ?? 0);
    const lines: GlJournalLine[] = [];

    const journalHdr = (journals || []).find(
      (j: any) => Number(j.type) === transType && Number(j.trans_no) === transNo
    );
    const journalAmount = journalHdr ? Number(journalHdr.amount) : amount;
    const journalRef = journalHdr?.reference ?? ref;

    if (transType === 10 && journalAmount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: receivable,
          creditAccount: sales,
          amount: journalAmount,
          memo: journalRef || "Sales invoice",
          chartByCode,
        })
      );
    }

    if (transType === 11 && journalAmount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: sales,
          creditAccount: receivable,
          amount: journalAmount,
          memo: journalRef || "Customer credit note",
          chartByCode,
        })
      );
    }

    if (transType === 12 && journalAmount > 0) {
      const bankGl = resolveBankGlCode(
        bankTransList,
        bankAccounts,
        12,
        transNo,
        prefValue(sysPrefs, "defaultCashAccount", "1060")
      );
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: String(bankGl),
          creditAccount: receivable,
          amount: journalAmount,
          memo: journalHdr?.source_ref || journalRef || "Customer payment",
          chartByCode,
        })
      );
    }

    if (transType === 13 && amount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: cogs,
          creditAccount: inventory,
          amount,
          memo: ref || "Delivery / cost of sales",
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
        title: transactionLabel,
        lines,
      });
      matchedJournalKeys.add(`${transType}-${transNo}`);
    }
  }

  // Fallback: show journal headers that match this sales reference/trans id
  // even if debtor transaction rows are missing/not matched.
  (journals || []).forEach((j: any) => {
    const transType = Number(j.type);
    const transNo = Number(j.trans_no);
    const key = `${transType}-${transNo}`;
    if (matchedJournalKeys.has(key)) return;

    if (transNoKey != null && !Number.isNaN(transNoKey)) {
      if (transNo !== transNoKey) return;
      if (transTypeKey != null && !Number.isNaN(transTypeKey) && transType !== transTypeKey) return;
    } else {
      const journalRef = String(j.reference ?? "").trim();
      if (refKey) {
        if (
          !journalRef ||
          !referencesEqual(journalRef, refKey)
        ) {
          return;
        }
      } else if (orderKey != null && !Number.isNaN(orderKey)) {
        return;
      } else {
        return;
      }
    }

    const amount = Math.abs(Number(j.amount) || 0);
    if (amount <= 0) return;

    const tranDate = j.tran_date ? String(j.tran_date).split("T")[0] : "";
    const ref = j.reference ?? reference ?? "";
    const title = TRANS_TYPE_LABELS[transType] ?? `Transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const lines: GlJournalLine[] = [];

    if (transType === 10) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: receivable,
          creditAccount: sales,
          amount,
          memo: ref || "Sales invoice",
          chartByCode,
        })
      );
    } else if (transType === 11) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: sales,
          creditAccount: receivable,
          amount,
          memo: ref || "Customer credit note",
          chartByCode,
        })
      );
    } else if (transType === 12) {
      const bankGl = resolveBankGlCode(
        bankTransList,
        bankAccounts,
        12,
        transNo,
        prefValue(sysPrefs, "defaultCashAccount", "1060")
      );
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: String(bankGl),
          creditAccount: receivable,
          amount,
          memo: j.source_ref || ref || "Customer payment",
          chartByCode,
        })
      );
    } else if (transType === 13) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: cogs,
          creditAccount: inventory,
          amount,
          memo: ref || "Delivery / cost of sales",
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
        title: transactionLabel,
        lines,
      });
      matchedJournalKeys.add(key);
    }
  });

  return groups;
}
