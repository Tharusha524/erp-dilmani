import {
  GlTransactionGroup,
  chartByCodeMap,
  pairGlLines,
  prefValue,
} from "./glJournalLinesCore";
import { referencesEqual } from "./exactReference";

export const INVENTORY_TRANS_TYPE_LABELS: Record<number, string> = {
  16: "Location Transfer",
  17: "Inventory Adjustment",
  13: "Delivery Note",
  25: "Purchase Delivery (GRN)",
};

export function buildInventoryGlJournalGroups(params: {
  stockMoves: any[];
  journals: any[];
  chartMasters: any[];
  sysPrefs: { name: string; value: string }[];
  reference?: string;
  trans_no?: number | string | null;
  trans_type?: number | string | null;
}): GlTransactionGroup[] {
  const { stockMoves, journals, chartMasters, sysPrefs, reference, trans_no, trans_type } =
    params;

  const inventory = prefValue(sysPrefs, "inventoryAccount", "1510");
  const adjustments = prefValue(sysPrefs, "inventoryAdjustmentsAccount", "5020");
  const chartByCode = chartByCodeMap(chartMasters);

  const refKey = reference ? String(reference) : "";
  const transNoKey = trans_no != null && trans_no !== "" ? Number(trans_no) : null;
  const typeKey = trans_type != null && trans_type !== "" ? Number(trans_type) : null;

  const related = (stockMoves || []).filter((m: any) => {
    const moveType = Number(m.type ?? m.trans_type);
    if (typeKey != null && moveType !== typeKey) return false;
    if (transNoKey != null && Number(m.trans_no) !== transNoKey) return false;
    if (refKey) {
      const rowRef = String(m.reference ?? "").trim();
      if (rowRef && referencesEqual(rowRef, refKey)) {
        return true;
      }
    }
    if (transNoKey != null || typeKey != null) return true;
    return false;
  });

  const byTrans = new Map<string, any[]>();
  related.forEach((m: any) => {
    const key = `${m.type ?? m.trans_type}-${m.trans_no}`;
    if (!byTrans.has(key)) byTrans.set(key, []);
    byTrans.get(key)!.push(m);
  });

  const groups: GlTransactionGroup[] = [];
  const matchedJournalKeys = new Set<string>();

  byTrans.forEach((moves, key) => {
    const first = moves[0];
    const transType = Number(first.type ?? first.trans_type ?? 17);
    const transNo = Number(first.trans_no ?? 0);
    const tranDate = first.tran_date
      ? String(first.tran_date).split("T")[0]
      : "";
    const ref = first.reference ?? reference ?? "";
    const title =
      INVENTORY_TRANS_TYPE_LABELS[transType] ?? `Stock transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const lines = [];

    const totalAmount = moves.reduce((sum, m) => {
      const qty = Number(m.qty ?? m.quantity ?? 0);
      const cost = Number(m.standard_cost ?? m.price ?? 0);
      return sum + Math.abs(qty * cost);
    }, 0);

    const journalHdr = (journals || []).find(
      (j: any) => Number(j.type) === transType && Number(j.trans_no) === transNo
    );
    const journalAmount = journalHdr ? Math.abs(Number(journalHdr.amount)) : totalAmount;

    if (transType === 17 && journalAmount > 0) {
      const netQty = moves.reduce((s, m) => s + Number(m.qty ?? 0), 0);
      if (netQty >= 0) {
        lines.push(
          ...pairGlLines({
            journalDate: tranDate,
            transaction: transactionLabel,
            debitAccount: inventory,
            creditAccount: adjustments,
            amount: journalAmount,
            memo: ref || "Inventory adjustment",
            chartByCode,
          })
        );
      } else {
        lines.push(
          ...pairGlLines({
            journalDate: tranDate,
            transaction: transactionLabel,
            debitAccount: adjustments,
            creditAccount: inventory,
            amount: journalAmount,
            memo: ref || "Inventory adjustment (decrease)",
            chartByCode,
          })
        );
      }
    }

    if (transType === 16) {
      // Location transfers: no standard GL pair unless amount provided via journal
      if (journalAmount > 0) {
        lines.push(
          ...pairGlLines({
            journalDate: tranDate,
            transaction: transactionLabel,
            debitAccount: inventory,
            creditAccount: inventory,
            amount: journalAmount,
            memo: ref || "Location transfer (revaluation)",
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
        title: transactionLabel,
        lines,
      });
      matchedJournalKeys.add(`${transType}-${transNo}`);
    }
  });

  // Fallback: include matching journals even when stock_moves rows are absent.
  (journals || []).forEach((j: any) => {
    const transType = Number(j.type);
    const transNo = Number(j.trans_no);
    const key = `${transType}-${transNo}`;
    if (matchedJournalKeys.has(key)) return;

    if (transNoKey != null && !Number.isNaN(transNoKey)) {
      if (transNo !== transNoKey) return;
      if (typeKey != null && !Number.isNaN(typeKey) && transType !== typeKey) return;
    } else {
      const journalRef = String(j.reference ?? "").trim();
      if (refKey) {
        if (
          !journalRef ||
          !referencesEqual(journalRef, refKey)
        ) {
          return;
        }
      } else if (typeKey != null) {
        if (transType !== typeKey) return;
      } else {
        return;
      }
    }

    const amount = Math.abs(Number(j.amount) || 0);
    if (amount <= 0) return;

    const tranDate = j.tran_date ? String(j.tran_date).split("T")[0] : "";
    const ref = j.reference ?? reference ?? "";
    const title =
      INVENTORY_TRANS_TYPE_LABELS[transType] ?? `Stock transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const lines = [];

    if (transType === 17) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: inventory,
          creditAccount: adjustments,
          amount,
          memo: ref || "Inventory adjustment",
          chartByCode,
        })
      );
    } else if (transType === 16) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: inventory,
          creditAccount: inventory,
          amount,
          memo: ref || "Location transfer (revaluation)",
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
