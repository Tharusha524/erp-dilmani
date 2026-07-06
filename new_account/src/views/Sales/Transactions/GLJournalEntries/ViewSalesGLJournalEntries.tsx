import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import { getBankTrans } from "../../../../api/BankTrans/BankTransApi";
import {
  buildSalesGlJournalGroups,
  TRANS_TYPE_LABELS,
} from "../../../../utils/salesGlJournalLines";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";
import { referencesEqual } from "../../../../utils/exactReference";
import { debtorTransNetTotal } from "../../../../utils/customerCredit";

const SALES_DOCUMENT_TYPES = new Set([10, 11, 12, 13]);
const SALES_GL_TYPE_ORDER = [13, 10, 11, 12];

export default function ViewSalesGLJournalEntries() {
  const { state } = useLocation();
  const {
    reference,
    date,
    invoiceDate,
    deliveryDate,
    orderNo,
    trans_no: stateTransNo,
    trans_type: stateTransType,
    transNo: stateTransNoAlt,
  } = (state as Record<string, unknown>) || {};

  const resolvedTransNo = stateTransNo ?? stateTransNoAlt;
  const displayDate =
    (deliveryDate as string) || (invoiceDate as string) || (date as string) || "";
  const displayRef = reference ? String(reference) : "";

  const { data: debtorTrans = [] } = useQuery({ queryKey: ["debtorTrans"], queryFn: getDebtorTrans });
  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: getBankAccounts });
  const { data: bankTrans = [] } = useQuery({ queryKey: ["bankTrans"], queryFn: getBankTrans });

  const primaryTrans = useMemo(() => {
    const list = debtorTrans || [];
    const requestedType =
      stateTransType != null && stateTransType !== ""
        ? Number(stateTransType)
        : null;

    if (resolvedTransNo != null && requestedType != null && !Number.isNaN(requestedType)) {
      const byTypeAndNo = list.find(
        (d: { trans_no?: number; trans_type?: number; reference?: string }) =>
          Number(d.trans_no) === Number(resolvedTransNo) &&
          Number(d.trans_type) === requestedType
      );
      if (byTypeAndNo) return byTypeAndNo;

      if (displayRef) {
        const byTypeNoRef = list.find(
          (d: { trans_no?: number; trans_type?: number; reference?: string }) =>
            Number(d.trans_no) === Number(resolvedTransNo) &&
            Number(d.trans_type) === requestedType &&
            referencesEqual(d.reference, displayRef)
        );
        if (byTypeNoRef) return byTypeNoRef;
      }

      // Explicit trans_type in navigation — never fall back to another document with the same trans_no.
      return null;
    }

    if (resolvedTransNo != null) {
      if (displayRef) {
        const byRefAndNo = list.find(
          (d: { trans_no?: number; reference?: string }) =>
            Number(d.trans_no) === Number(resolvedTransNo) &&
            referencesEqual(d.reference, displayRef)
        );
        if (byRefAndNo) return byRefAndNo;
      }
      const found = list.find(
        (d: { trans_no?: number }) => Number(d.trans_no) === Number(resolvedTransNo)
      );
      if (found) return found;
    }
    if (displayRef) {
      if (Number(stateTransType) === 13 && resolvedTransNo != null) {
        const delivery = list.find(
          (d: { trans_no?: number; trans_type?: number; reference?: string }) =>
            Number(d.trans_type) === 13 &&
            Number(d.trans_no) === Number(resolvedTransNo) &&
            referencesEqual(d.reference, displayRef)
        );
        if (delivery) return delivery;
      }
      const exact = list.find((d: { reference?: string; trans_type?: number }) => {
        if (!referencesEqual(d.reference, displayRef)) return false;
        if (requestedType != null && !Number.isNaN(requestedType)) {
          return Number(d.trans_type) === requestedType;
        }
        return true;
      });
      if (exact) return exact;
    }
    if (orderNo != null) {
      return list.find((d: { order_no?: number }) => Number(d.order_no) === Number(orderNo)) ?? null;
    }
    return null;
  }, [debtorTrans, resolvedTransNo, stateTransType, displayRef, orderNo]);

  const lookupTransNo = primaryTrans?.trans_no ?? resolvedTransNo;
  const lookupTransType = primaryTrans?.trans_type ?? stateTransType;
  const lookupReference =
    displayRef || (primaryTrans?.reference ? String(primaryTrans.reference) : undefined);

  const documentTransType =
    stateTransType != null && stateTransType !== ""
      ? Number(stateTransType)
      : lookupTransType != null
        ? Number(lookupTransType)
        : null;
  const documentTransNo =
    resolvedTransNo != null && resolvedTransNo !== ""
      ? Number(resolvedTransNo)
      : lookupTransNo != null
        ? Number(lookupTransNo)
        : null;

  const hasDocumentScope =
    documentTransType != null &&
    !Number.isNaN(documentTransType) &&
    SALES_DOCUMENT_TYPES.has(documentTransType);

  const fallbackGroups = useMemo(
    () =>
      buildSalesGlJournalGroups({
        debtorTransList: debtorTrans,
        journals,
        chartMasters,
        sysPrefs,
        bankAccounts,
        bankTransList: bankTrans,
        transNo: documentTransNo ?? lookupTransNo,
        transType: documentTransType ?? lookupTransType,
        reference: lookupReference,
        orderNo: hasDocumentScope ? undefined : orderNo ?? primaryTrans?.order_no,
      }),
    [
      debtorTrans,
      journals,
      chartMasters,
      sysPrefs,
      bankAccounts,
      bankTrans,
      lookupReference,
      orderNo,
      primaryTrans,
      documentTransNo,
      documentTransType,
      lookupTransNo,
      lookupTransType,
      hasDocumentScope,
    ]
  );

  const { groups: rawGroups, isLoading } = useGlPostingsGroups(
    {
      module: "sales",
      order_no: hasDocumentScope ? undefined : orderNo ?? primaryTrans?.order_no,
      trans_no: documentTransNo ?? undefined,
      trans_type: documentTransType ?? undefined,
      reference: lookupReference,
    },
    fallbackGroups
  );

  const groups = useMemo(() => {
    let list = [...rawGroups].sort(
      (a, b) =>
        (SALES_GL_TYPE_ORDER.indexOf(a.transType) === -1
          ? 99
          : SALES_GL_TYPE_ORDER.indexOf(a.transType)) -
          (SALES_GL_TYPE_ORDER.indexOf(b.transType) === -1
            ? 99
            : SALES_GL_TYPE_ORDER.indexOf(b.transType)) ||
        a.transNo - b.transNo
    );

    if (hasDocumentScope && documentTransNo != null && !Number.isNaN(documentTransNo)) {
      list = list.filter((g) => g.transType === documentTransType);
      list = list.filter((g) => g.transNo === documentTransNo);
    }

    return list;
  }, [rawGroups, hasDocumentScope, documentTransType, documentTransNo]);

  const pageTitle = primaryTrans
    ? `${TRANS_TYPE_LABELS[Number(primaryTrans.trans_type)] ?? "Transaction"} — ${primaryTrans.reference ?? displayRef}`
    : displayRef
      ? `Reference ${displayRef}`
      : "Sales GL Journal Entries";

  const documentAmount = useMemo(() => {
    if (!primaryTrans) return undefined;
    const total = Math.abs(debtorTransNetTotal(primaryTrans));
    return total > 0.001 ? total : undefined;
  }, [primaryTrans]);

  return (
    <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Sales", href: "/sales" },
        { title: "Transactions", href: "/sales/transactions" },
        { title: "GL Journal Entries" },
      ]}
      pageTitle={pageTitle}
      reference={lookupReference}
      transactionDate={
        displayDate ||
        (primaryTrans?.tran_date ? String(primaryTrans.tran_date).split("T")[0] : undefined)
      }
      transNo={lookupTransNo}
      transTypeLabel={
        primaryTrans
          ? TRANS_TYPE_LABELS[Number(primaryTrans.trans_type)] ?? String(primaryTrans.trans_type)
          : documentTransType != null
            ? TRANS_TYPE_LABELS[documentTransType]
            : undefined
      }
      orderNo={orderNo ?? primaryTrans?.order_no}
      orderNoLabel="Sales Order #"
      groups={groups}
      isLoading={isLoading}
      documentAmount={documentAmount}
      emptyMessage="No GL journal entries were found for this sales transaction. Deliveries post COGS/inventory; invoices post AR/revenue; payments post bank/AR."
    />
  );
}
