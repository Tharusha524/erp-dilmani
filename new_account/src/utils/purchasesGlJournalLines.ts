import {
  GlTransactionGroup,
  chartByCodeMap,
  pairGlLines,
  prefValue,
  resolveBankGlCode,
} from "./glJournalLinesCore";
import { referencesEqual } from "./exactReference";

export const PURCHASE_TRANS_TYPE_LABELS: Record<number, string> = {
  18: "Purchase Order",
  20: "Supplier Invoice",
  21: "Supplier Credit Note",
  22: "Supplier Payment",
  25: "Purchase Delivery (GRN)",
};

export function buildPurchasesGlJournalGroups(params: {
  suppTransList: any[];
  journals: any[];
  chartMasters: any[];
  sysPrefs: { name: string; value: string }[];
  bankAccounts: any[];
  bankTransList: any[];
  grnBatches?: any[];
  grnItems?: any[];
  purchOrderDetails?: any[];
  reference?: string;
  orderNo?: number | string | null;
  transNo?: number | string | null;
  transType?: number | string | null;
}): GlTransactionGroup[] {
  const {
    suppTransList,
    journals,
    chartMasters,
    sysPrefs,
    bankAccounts,
    bankTransList,
    grnBatches = [],
    grnItems = [],
    purchOrderDetails = [],
    reference,
    orderNo,
    transNo,
    transType,
  } = params;

  const payable = prefValue(sysPrefs, "payableAccount", "2100");
  const grnClearing = prefValue(sysPrefs, "grnClearingAccount", "1550");
  const inventory = prefValue(sysPrefs, "inventoryAccount", "1510");
  const chartByCode = chartByCodeMap(chartMasters);

  const refKey = reference ? String(reference) : "";
  const orderKey = orderNo != null && orderNo !== "" ? Number(orderNo) : null;
  const transNoKey = transNo != null && transNo !== "" ? Number(transNo) : null;
  const transTypeKey = transType != null && transType !== "" ? Number(transType) : null;

  const related = (suppTransList || []).filter((st: any) => {
    if (transNoKey != null && !Number.isNaN(transNoKey)) {
      if (Number(st.trans_no) !== transNoKey) return false;
      if (
        transTypeKey != null &&
        !Number.isNaN(transTypeKey) &&
        Number(st.trans_type) !== transTypeKey
      ) {
        return false;
      }
      return true;
    }
    if (refKey) {
      const rowRef = String(st.reference ?? "").trim();
      if (rowRef && referencesEqual(rowRef, refKey)) {
        return true;
      }
    }
    if (orderKey != null && !Number.isNaN(orderKey) && Number(st.order_no) === orderKey) return true;
    return false;
  });

  const typesOrder = [25, 20, 21, 22];
  const sorted = [...related].sort(
    (a, b) =>
      typesOrder.indexOf(Number(a.trans_type)) - typesOrder.indexOf(Number(b.trans_type)) ||
      Number(a.trans_no) - Number(b.trans_no)
  );

  const groups: GlTransactionGroup[] = [];
  const matchedJournalKeys = new Set<string>();

  for (const st of sorted) {
    const transType = Number(st.trans_type);
    const transNo = Number(st.trans_no);
    const tranDate = st.tran_date ? String(st.tran_date).split("T")[0] : "";
    const ref = st.reference ?? reference ?? "";
    const title = PURCHASE_TRANS_TYPE_LABELS[transType] ?? `Transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const amount = Math.abs(Number(st.ov_amount ?? st.alloc ?? 0));
    const lines = [];

    const journalHdr = (journals || []).find(
      (j: any) => Number(j.type) === transType && Number(j.trans_no) === transNo
    );
    const journalAmount = Math.abs(
      journalHdr ? Number(journalHdr.amount) : amount
    );
    const journalRef = journalHdr?.reference ?? ref;

    if (transType === 20 && journalAmount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: grnClearing || inventory,
          creditAccount: payable,
          amount: journalAmount,
          memo: journalRef || "Supplier invoice",
          chartByCode,
        })
      );
    }

    if (transType === 21 && journalAmount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: payable,
          creditAccount: grnClearing || inventory,
          amount: journalAmount,
          memo: journalRef || "Supplier credit note",
          chartByCode,
        })
      );
    }

    if (transType === 22 && journalAmount > 0) {
      const bankGl = resolveBankGlCode(
        bankTransList,
        bankAccounts,
        22,
        transNo,
        prefValue(sysPrefs, "defaultCashAccount", "1060")
      );
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: payable,
          creditAccount: String(bankGl),
          amount: journalAmount,
          memo: journalHdr?.source_ref || journalRef || "Supplier payment",
          chartByCode,
        })
      );
    }

    if (transType === 25 && amount > 0) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: inventory,
          creditAccount: grnClearing,
          amount,
          memo: ref || "Goods received",
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

  // GRN deliveries live in grn_batch (not supp_trans).
  for (const grn of grnBatches) {
    const grnId = Number(grn.id);
    if (Number.isNaN(grnId) || grnId <= 0) continue;
    const key = `25-${grnId}`;
    if (matchedJournalKeys.has(key)) continue;

    if (transNoKey != null && !Number.isNaN(transNoKey) && grnId !== transNoKey) continue;
    if (transTypeKey != null && !Number.isNaN(transTypeKey) && transTypeKey !== 25) continue;
    if (refKey) {
      const grnRef = String(grn.reference ?? "").trim();
      if (!grnRef || !referencesEqual(grnRef, refKey)) continue;
    }
    if (orderKey != null && !Number.isNaN(orderKey) && Number(grn.purch_order_no) !== orderKey) {
      continue;
    }

    const batchItems = (grnItems || []).filter(
      (gi: any) => Number(gi.grn_batch_id) === grnId
    );
    let amount = 0;
    for (const gi of batchItems) {
      const qty = Number(gi.qty_recd ?? 0);
      const poDetail = (purchOrderDetails || []).find(
        (d: any) => Number(d.po_detail_item) === Number(gi.po_detail_item)
      );
      const unitPrice = poDetail
        ? Number(poDetail.act_price ?? poDetail.unit_price ?? 0)
        : 0;
      amount += qty * unitPrice;
    }
    if (amount <= 0) continue;

    const tranDate = grn.delivery_date ? String(grn.delivery_date).split("T")[0] : "";
    const ref = grn.reference ?? reference ?? "";
    const transactionLabel = `${PURCHASE_TRANS_TYPE_LABELS[25]} #${grnId}`;
    const lines = pairGlLines({
      journalDate: tranDate,
      transaction: transactionLabel,
      debitAccount: inventory,
      creditAccount: grnClearing,
      amount,
      memo: ref || "Goods received",
      chartByCode,
    });

    if (lines.length > 0) {
      groups.push({
        transType: 25,
        transNo: grnId,
        reference: ref,
        tranDate,
        title: transactionLabel,
        lines,
      });
      matchedJournalKeys.add(key);
    }
  }

  // Fallback: include matching journal headers if supp transactions did not match.
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
    const title = PURCHASE_TRANS_TYPE_LABELS[transType] ?? `Transaction type ${transType}`;
    const transactionLabel = `${title} #${transNo}`;
    const lines = [];

    if (transType === 20) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: grnClearing || inventory,
          creditAccount: payable,
          amount,
          memo: ref || "Supplier invoice",
          chartByCode,
        })
      );
    } else if (transType === 21) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: payable,
          creditAccount: grnClearing || inventory,
          amount,
          memo: ref || "Supplier credit note",
          chartByCode,
        })
      );
    } else if (transType === 22) {
      const bankGl = resolveBankGlCode(
        bankTransList,
        bankAccounts,
        22,
        transNo,
        prefValue(sysPrefs, "defaultCashAccount", "1060")
      );
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: payable,
          creditAccount: String(bankGl),
          amount,
          memo: j.source_ref || ref || "Supplier payment",
          chartByCode,
        })
      );
    } else if (transType === 25) {
      lines.push(
        ...pairGlLines({
          journalDate: tranDate,
          transaction: transactionLabel,
          debitAccount: inventory,
          creditAccount: grnClearing,
          amount,
          memo: ref || "Goods received",
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
