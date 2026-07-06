import React, { useMemo, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { getSuppTrans } from "../../../../api/SuppTrans/SuppTransApi";
import { getBankTrans } from "../../../../api/BankTrans/BankTransApi";
import { getGrnBatches } from "../../../../api/GRN/GrnBatchApi";
import { getGrnItems } from "../../../../api/GRN/GrnItemsApi";
import { getPurchOrderDetails } from "../../../../api/PurchOrders/PurchOrderDetailsApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import {
  buildPurchasesGlJournalGroups,
  PURCHASE_TRANS_TYPE_LABELS,
} from "../../../../utils/purchasesGlJournalLines";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";
import { referencesEqual } from "../../../../utils/exactReference";
import { readPurchasesGlJournalNav } from "../../../../utils/purchasesGlNavigation";
import { purchasesGlJournalPath } from "../../../../utils/purchasesGlNavigation";
import PurchasesGlJournalLookup from "../../../../components/Purchases/PurchasesGlJournalLookup";

function normalizeGlDate(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).split("T")[0];
}

function pickNewestSuppTrans(
  list: Array<{
    trans_no?: number;
    trans_type?: number;
    reference?: string;
    trans_date?: string;
    tran_date?: string;
  }>,
  opts: { reference?: string; transType?: number; date?: string }
) {
  if (!opts.reference) return null;
  let matches = list.filter((s) => referencesEqual(s.reference, opts.reference));
  if (matches.length === 0) return null;

  if (opts.transType === 22) {
    matches = matches.filter((s) => Number(s.trans_type) === 22);
  } else {
    matches = matches.filter((s) => Number(s.trans_type) !== 22);
    if (opts.transType != null) {
      const byType = matches.filter(
        (s) => Number(s.trans_type) === Number(opts.transType)
      );
      if (byType.length > 0) matches = byType;
    }
  }

  if (opts.date) {
    const want = normalizeGlDate(opts.date);
    const byDate = matches.filter(
      (s) => normalizeGlDate(s.trans_date ?? s.tran_date) === want
    );
    if (byDate.length > 0) matches = byDate;
  }

  return matches.reduce((best, s) =>
    Number(s.trans_no ?? 0) > Number(best.trans_no ?? 0) ? s : best
  );
}

function pickNewestGrnBatch(
  list: Array<{ id?: number; reference?: string; delivery_date?: string }>,
  opts: { reference?: string; date?: string }
) {
  if (!opts.reference) return null;
  let matches = list.filter((g) => referencesEqual(g.reference, opts.reference));
  if (matches.length === 0) return null;

  if (opts.date) {
    const want = normalizeGlDate(opts.date);
    const byDate = matches.filter(
      (g) => normalizeGlDate(g.delivery_date) === want
    );
    if (byDate.length > 0) matches = byDate;
  }

  return matches.reduce((best, g) =>
    Number(g.id ?? 0) > Number(best.id ?? 0) ? g : best
  );
}

export default function ViewPurchasesGLJournalEntries() {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [searchParams] = useSearchParams();
  const nav = readPurchasesGlJournalNav(searchParams, locationState as Record<string, unknown>);

  const {
    reference,
    date,
    orderNo,
    purchaseOrderRef,
    trans_no: stateTransNo,
    trans_type: stateTransType,
    grnBatchId,
    deliveryDate,
  } = nav;

  const {
    datePaid,
    allocations: paymentAllocations,
    amount: paymentAmount,
  } = (locationState as Record<string, unknown>) || {};

  const requestedTransType =
    stateTransType != null && stateTransType !== ""
      ? Number(stateTransType)
      : null;
  const requestedTransNo =
    stateTransNo != null && stateTransNo !== "" ? Number(stateTransNo) : null;

  const displayDate =
    (deliveryDate as string) || (datePaid as string) || (date as string) || "";
  const displayRef = reference ? String(reference) : "";
  const resolvedOrderNo = orderNo ?? purchaseOrderRef ?? undefined;
  const resolvedGrnId =
    grnBatchId ?? (requestedTransType === 25 ? stateTransNo : undefined);

  const hasLookupContext =
    (requestedTransNo != null && !Number.isNaN(requestedTransNo)) ||
    (resolvedGrnId != null &&
      resolvedGrnId !== "" &&
      !Number.isNaN(Number(resolvedGrnId))) ||
    Boolean(displayRef) ||
    (resolvedOrderNo != null && resolvedOrderNo !== "");

  // Persist navigation state into the URL so refresh / bookmark works
  useEffect(() => {
    const hasQuery =
      searchParams.get("trans_no") ||
      searchParams.get("reference") ||
      searchParams.get("grnBatchId") ||
      searchParams.get("orderNo");
    if (hasQuery) return;

    const hasState =
      (stateTransNo != null && stateTransNo !== "") ||
      Boolean(reference) ||
      (grnBatchId != null && grnBatchId !== "") ||
      (orderNo != null && orderNo !== "") ||
      (purchaseOrderRef != null && purchaseOrderRef !== "");
    if (!hasState) return;

    navigate(
      purchasesGlJournalPath({
        trans_no: stateTransNo,
        trans_type: stateTransType,
        reference,
        date,
        orderNo,
        purchaseOrderRef,
        grnBatchId,
        deliveryDate,
      }),
      { replace: true, state: locationState }
    );
  }, [
    searchParams,
    stateTransNo,
    stateTransType,
    reference,
    date,
    orderNo,
    purchaseOrderRef,
    grnBatchId,
    deliveryDate,
    navigate,
    locationState,
  ]);

  const { data: suppTrans = [] } = useQuery({ queryKey: ["suppTrans"], queryFn: getSuppTrans });
  const { data: bankTrans = [] } = useQuery({ queryKey: ["bankTrans"], queryFn: getBankTrans });
  const { data: grnBatches = [] } = useQuery({ queryKey: ["grnBatches"], queryFn: getGrnBatches });
  const { data: grnItems = [] } = useQuery({ queryKey: ["grnItems"], queryFn: getGrnItems });
  const { data: purchOrderDetails = [] } = useQuery({
    queryKey: ["purchOrderDetails"],
    queryFn: getPurchOrderDetails,
  });
  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: getBankAccounts });

  const grnBatch = useMemo(() => {
    const list = grnBatches || [];
    if (resolvedGrnId != null) {
      const found = list.find((g: any) => Number(g.id) === Number(resolvedGrnId));
      if (found) return found;
    }
    if (displayRef) {
      const found = pickNewestGrnBatch(list, {
        reference: displayRef,
        date: displayDate || undefined,
      });
      if (found) return found;
    }
    if (resolvedOrderNo != null) {
      return (
        list.find((g: any) => Number(g.purch_order_no) === Number(resolvedOrderNo)) ?? null
      );
    }
    return null;
  }, [grnBatches, resolvedGrnId, displayRef, resolvedOrderNo]);

  const primaryTrans = useMemo(() => {
    const list = suppTrans || [];

    if (
      requestedTransNo != null &&
      !Number.isNaN(requestedTransNo) &&
      requestedTransType != null &&
      !Number.isNaN(requestedTransType)
    ) {
      const byTypeAndNo = list.find(
        (s: { trans_no?: number; trans_type?: number; reference?: string }) =>
          Number(s.trans_no) === requestedTransNo &&
          Number(s.trans_type) === requestedTransType
      );
      if (byTypeAndNo) return byTypeAndNo;

      if (displayRef) {
        const byTypeNoRef = list.find(
          (s: { trans_no?: number; trans_type?: number; reference?: string }) =>
            Number(s.trans_no) === requestedTransNo &&
            Number(s.trans_type) === requestedTransType &&
            referencesEqual(s.reference, displayRef)
        );
        if (byTypeNoRef) return byTypeNoRef;
      }

      // Explicit trans_no + trans_type — do not fall back to another doc with the same reference.
      return null;
    }

    if (requestedTransNo != null && !Number.isNaN(requestedTransNo)) {
      if (displayRef) {
        const byRefAndNo = list.find(
          (s: { trans_no?: number; reference?: string }) =>
            Number(s.trans_no) === requestedTransNo &&
            referencesEqual(s.reference, displayRef)
        );
        if (byRefAndNo) return byRefAndNo;
      }
      const found = list.find(
        (s: { trans_no?: number }) => Number(s.trans_no) === requestedTransNo
      );
      if (found) return found;
    }

    if (displayRef) {
      if (requestedTransType === 22 && requestedTransNo != null) {
        const payment = list.find(
          (s: { trans_no?: number; trans_type?: number; reference?: string }) =>
            Number(s.trans_type) === 22 &&
            Number(s.trans_no) === requestedTransNo &&
            referencesEqual(s.reference, displayRef)
        );
        if (payment) return payment;
      }
      const exact = pickNewestSuppTrans(list, {
        reference: displayRef,
        transType: requestedTransType ?? undefined,
        date: displayDate || undefined,
      });
      if (exact) return exact;
    }
    if (resolvedOrderNo != null) {
      return list.find((s: { order_no?: number }) => Number(s.order_no) === Number(resolvedOrderNo)) ?? null;
    }
    return null;
  }, [
    suppTrans,
    requestedTransNo,
    requestedTransType,
    displayRef,
    displayDate,
    resolvedOrderNo,
  ]);

  const relatedBankTrans = useMemo(() => {
    if (requestedTransType === 22 && requestedTransNo != null) {
      const byNo = (bankTrans || []).find(
        (b: { type?: number; trans_no?: number }) =>
          Number(b.type) === 22 && Number(b.trans_no) === requestedTransNo
      );
      if (byNo) return byNo;
    }
    if (!displayRef && !primaryTrans?.reference && !grnBatch?.reference) return null;
    const ref =
      displayRef ||
      String(primaryTrans?.reference ?? grnBatch?.reference ?? "");
    return (
      (bankTrans || []).find((b: { ref?: string; type?: number }) =>
        referencesEqual(b.ref, ref) && Number(b.type) === 22
      ) ?? null
    );
  }, [bankTrans, displayRef, primaryTrans, grnBatch, requestedTransType, requestedTransNo]);

  const lookupTransNo =
    primaryTrans?.trans_no ??
    requestedTransNo ??
    (grnBatch?.id != null ? grnBatch.id : undefined) ??
    relatedBankTrans?.trans_no ??
    undefined;
  const lookupTransType =
    primaryTrans?.trans_type ??
    requestedTransType ??
    (grnBatch?.id != null ? 25 : undefined) ??
    relatedBankTrans?.type ??
    undefined;

  const lookupReference =
    displayRef ||
    (primaryTrans?.reference ? String(primaryTrans.reference) : undefined) ||
    (grnBatch?.reference ? String(grnBatch.reference) : undefined) ||
    (relatedBankTrans?.ref ? String(relatedBankTrans.ref) : undefined);

  const PURCHASE_DOCUMENT_TYPES = new Set([20, 21, 22, 25]);

  const documentTransType =
    requestedTransType != null && !Number.isNaN(requestedTransType)
      ? requestedTransType
      : lookupTransType != null
        ? Number(lookupTransType)
        : null;
  const documentTransNo =
    requestedTransNo != null && !Number.isNaN(requestedTransNo)
      ? requestedTransNo
      : lookupTransNo != null
        ? Number(lookupTransNo)
        : grnBatch?.id != null
          ? Number(grnBatch.id)
          : relatedBankTrans?.trans_no != null
            ? Number(relatedBankTrans.trans_no)
            : null;

  const hasDocumentScope =
    documentTransType != null &&
    !Number.isNaN(documentTransType) &&
    PURCHASE_DOCUMENT_TYPES.has(documentTransType);

  const fallbackGroups = useMemo(
    () =>
      buildPurchasesGlJournalGroups({
        suppTransList: suppTrans,
        journals,
        chartMasters,
        sysPrefs,
        bankAccounts,
        bankTransList: bankTrans,
        grnBatches,
        grnItems,
        purchOrderDetails,
        transNo: documentTransNo ?? lookupTransNo,
        transType: documentTransType ?? lookupTransType,
        reference: lookupReference,
        orderNo: hasDocumentScope ? undefined : resolvedOrderNo ?? grnBatch?.purch_order_no,
      }),
    [
      suppTrans,
      journals,
      chartMasters,
      sysPrefs,
      bankAccounts,
      bankTrans,
      grnBatches,
      grnItems,
      purchOrderDetails,
      lookupTransNo,
      lookupTransType,
      documentTransNo,
      documentTransType,
      lookupReference,
      resolvedOrderNo,
      grnBatch,
    ]
  );

  const { groups: rawGroups, isLoading } = useGlPostingsGroups(
    {
      module: "purchases",
      purch_order_no: hasDocumentScope
        ? undefined
        : resolvedOrderNo ?? primaryTrans?.order_no ?? grnBatch?.purch_order_no,
      trans_no: documentTransNo ?? undefined,
      trans_type: documentTransType ?? undefined,
      reference: lookupReference,
    },
    fallbackGroups
  );

  const PURCHASE_GL_TYPE_ORDER = [25, 20, 21, 22];
  const groups = useMemo(() => {
    let list = [...rawGroups].sort(
      (a, b) =>
        (PURCHASE_GL_TYPE_ORDER.indexOf(a.transType) === -1
          ? 99
          : PURCHASE_GL_TYPE_ORDER.indexOf(a.transType)) -
          (PURCHASE_GL_TYPE_ORDER.indexOf(b.transType) === -1
            ? 99
            : PURCHASE_GL_TYPE_ORDER.indexOf(b.transType)) ||
        a.transNo - b.transNo
    );

    if (hasDocumentScope) {
      list = list.filter((g) => g.transType === documentTransType);
      if (documentTransNo != null && !Number.isNaN(documentTransNo)) {
        list = list.filter((g) => g.transNo === documentTransNo);
      }
    }

    return list;
  }, [rawGroups, hasDocumentScope, documentTransType, documentTransNo]);

  const transactionDate =
    displayDate ||
    (grnBatch?.delivery_date
      ? String(grnBatch.delivery_date).split("T")[0]
      : undefined) ||
    (primaryTrans?.trans_date
      ? String(primaryTrans.trans_date).split("T")[0]
      : primaryTrans?.tran_date
        ? String(primaryTrans.tran_date).split("T")[0]
        : undefined) ||
    (relatedBankTrans?.trans_date
      ? String(relatedBankTrans.trans_date).split("T")[0]
      : undefined);

  const pageTitle = primaryTrans
    ? `${PURCHASE_TRANS_TYPE_LABELS[Number(primaryTrans.trans_type)] ?? "Transaction"} — ${primaryTrans.reference ?? displayRef}`
    : grnBatch
      ? `${PURCHASE_TRANS_TYPE_LABELS[25]} — ${grnBatch.reference ?? displayRef}`
      : relatedBankTrans && requestedTransType === 22
        ? `${PURCHASE_TRANS_TYPE_LABELS[22]} — ${displayRef}`
        : displayRef
          ? `Reference ${displayRef}`
          : "Purchases GL Journal Entries";

  const documentAmount =
    primaryTrans != null
      ? Math.abs(Number(primaryTrans.ov_amount ?? 0) + Number(primaryTrans.ov_gst ?? 0))
      : undefined;

  const allocationRows = Array.isArray(paymentAllocations) ? paymentAllocations : [];

  return (
    <>
      {!hasLookupContext ? <PurchasesGlJournalLookup /> : null}
      <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Purchases", href: "/purchase" },
        { title: "Transactions", href: "/purchase" },
        { title: "GL Journal Entries" },
      ]}
      pageTitle={pageTitle}
      reference={lookupReference}
      transactionDate={transactionDate}
      transNo={lookupTransNo}
      transTypeLabel={
        primaryTrans
          ? PURCHASE_TRANS_TYPE_LABELS[Number(primaryTrans.trans_type)] ??
            String(primaryTrans.trans_type)
          : documentTransType != null
            ? PURCHASE_TRANS_TYPE_LABELS[documentTransType] ??
              String(documentTransType)
          : grnBatch
            ? PURCHASE_TRANS_TYPE_LABELS[25]
            : relatedBankTrans?.type != null
              ? PURCHASE_TRANS_TYPE_LABELS[Number(relatedBankTrans.type)] ??
                String(relatedBankTrans.type)
              : requestedTransType === 22
                ? PURCHASE_TRANS_TYPE_LABELS[22]
                : undefined
      }
      orderNo={resolvedOrderNo ?? primaryTrans?.order_no ?? grnBatch?.purch_order_no}
      orderNoLabel="Purchase Order #"
      groups={groups}
      isLoading={isLoading}
      documentAmount={
        documentAmount != null && documentAmount > 0.001 ? documentAmount : undefined
      }
      emptyMessage={
        hasLookupContext
          ? "No GL journal entries were found for this purchase transaction. GRN posts inventory/clearing; supplier invoices post clearing/AP."
          : undefined
      }
      paymentSummary={
        Number(documentTransType) === 22
          ? {
              amount: paymentAmount != null ? Number(paymentAmount) : undefined,
              allocations: allocationRows as {
                type?: string;
                number?: number | string;
                date?: string;
                totalAmount?: number;
                leftToAllocate?: number;
                allocation?: number;
              }[],
            }
          : undefined
      }
    />
    </>
  );
}
