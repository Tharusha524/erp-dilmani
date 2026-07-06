import {
  GlTransactionGroup,
  chartByCodeMap,
  pairGlLines,
  prefValue,
} from "./glJournalLinesCore";
import { buildPurchasesGlJournalGroups } from "./purchasesGlJournalLines";
import { buildSalesGlJournalGroups } from "./salesGlJournalLines";
import { referencesEqual } from "./exactReference";

export const FIXED_ASSETS_TRANS_TYPE_LABELS: Record<number, string> = {
  0: "Journal Entry",
  10: "Sales Invoice",
  13: "Delivery Note",
  17: "Inventory Adjustment",
  20: "Supplier Invoice",
  25: "Purchase Delivery",
};

/**
 * Fixed-asset flows may post as supplier invoice, sales invoice, or journal header.
 * Merge related GL groups from purchases, sales, and journal-only entries.
 */
export function buildFixedAssetsGlJournalGroups(params: {
  suppTransList: any[];
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
    suppTransList,
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

  const transNoKey = transNo != null && transNo !== "" ? Number(transNo) : null;
  const transTypeKey =
    transType != null && transType !== "" ? Number(transType) : null;
  const scopedToTransaction =
    transNoKey != null &&
    !Number.isNaN(transNoKey) &&
    transTypeKey != null &&
    !Number.isNaN(transTypeKey);

  const purchaseGroups = buildPurchasesGlJournalGroups({
    suppTransList,
    journals,
    chartMasters,
    sysPrefs,
    bankAccounts,
    bankTransList,
    reference,
    orderNo,
    transNo,
    transType,
  });

  const salesGroups = buildSalesGlJournalGroups({
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
  });

  const refKey = reference ? String(reference) : "";
  const chartByCode = chartByCodeMap(chartMasters);
  const inventory = prefValue(sysPrefs, "inventoryAccount", "1510");
  const payable = prefValue(sysPrefs, "payableAccount", "2100");
  const receivable = prefValue(sysPrefs, "receivableAccount", "1200");
  const sales = prefValue(sysPrefs, "salesAccount", "4010");
  const lossDisposal = prefValue(sysPrefs, "lossOnAssetDisposalAccount", "5660");

  const journalOnly: GlTransactionGroup[] = [];
  const matchedJournalKeys = new Set<string>();

  [...purchaseGroups, ...salesGroups].forEach((g) => {
    matchedJournalKeys.add(`${g.transType}-${g.transNo}`);
  });

  (journals || []).forEach((j: any) => {
    const jRef = String(j.reference ?? "");
    if (refKey && jRef && !referencesEqual(jRef, refKey)) return;

    const transType = Number(j.type);
    const transNo = Number(j.trans_no);
    if (
      scopedToTransaction &&
      (transType !== transTypeKey || transNo !== transNoKey)
    ) {
      return;
    }

    const key = `${j.type}-${j.trans_no}`;
    if (matchedJournalKeys.has(key)) return;
    const amount = Math.abs(Number(j.amount) || 0);
    if (amount <= 0) return;

    const tranDate = j.tran_date ? String(j.tran_date).split("T")[0] : "";
    const title =
      FIXED_ASSETS_TRANS_TYPE_LABELS[transType] ?? `Journal type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const lines = [];

    if (transType === 20) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: inventory,
          creditAccount: payable,
          amount,
          memo: jRef || "Fixed asset purchase",
          chartByCode,
        })
      );
    } else if (transType === 10) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: receivable,
          creditAccount: sales,
          amount,
          memo: jRef || "Fixed asset sale",
          chartByCode,
        })
      );
    } else {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: lossDisposal,
          creditAccount: inventory,
          amount,
          memo: jRef || j.source_ref || "Fixed asset transaction",
          chartByCode,
        })
      );
    }

    if (lines.length > 0) {
      journalOnly.push({
        transType,
        transNo,
        reference: jRef || refKey,
        tranDate,
        title: transactionLabel,
        lines,
      });
      matchedJournalKeys.add(key);
    }
  });

  return [...purchaseGroups, ...salesGroups, ...journalOnly];
}
