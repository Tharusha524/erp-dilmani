import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import { getBankTrans } from "../../../../api/BankTrans/BankTransApi";
import {
  BANKING_TRANS_TYPE_LABELS,
  buildBankingGlJournalGroups,
  BankingFormLine,
} from "../../../../utils/bankingGlJournalLines";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";

export default function ViewBankingGLJournalEntries() {
  const { state } = useLocation();
  const {
    reference,
    date,
    trans_no: stateTransNo,
    trans_type: stateTransType,
    lines: stateLines,
    from: bankFrom,
    bankAccountId,
    transactionKind,
    autoPrint: autoPrintFlag,
  } = (state as Record<string, unknown>) || {};

  const displayRef = reference ? String(reference) : "";
  const displayDate = date ? String(date) : "";
  const hasLookupContext =
    !!displayRef ||
    (stateTransNo != null && !Number.isNaN(Number(stateTransNo))) ||
    (stateTransType != null && !Number.isNaN(Number(stateTransType))) ||
    !!stateLines;

  const { data: bankTrans = [] } = useQuery({ queryKey: ["bankTrans"], queryFn: getBankTrans });
  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: getBankAccounts });

  const primaryBank = useMemo(() => {
    const list = bankTrans || [];
    if (stateTransNo != null && stateTransType != null) {
      return list.find(
        (b: any) =>
          Number(b.trans_no) === Number(stateTransNo) && Number(b.type) === Number(stateTransType)
      );
    }
    if (displayRef) return list.find((b: any) => String(b.ref) === displayRef);
    return null;
  }, [bankTrans, stateTransNo, stateTransType, displayRef]);

  const kind = useMemo(() => {
    if (transactionKind) return transactionKind as "payment" | "deposit" | "journal";
    if (primaryBank) {
      const t = Number(primaryBank.type);
      if (t === 1) return "payment";
      if (t === 2) return "deposit";
    }
    if (stateTransType != null) {
      const t = Number(stateTransType);
      if (t === 1) return "payment";
      if (t === 2) return "deposit";
      if (t === 0) return "journal";
    }
    if (stateLines) return "payment";
    return undefined;
  }, [transactionKind, primaryBank, stateTransType, stateLines]);

  const fallbackGroups = useMemo(
    () =>
      buildBankingGlJournalGroups({
        bankTransList: bankTrans,
        journals,
        chartMasters,
        sysPrefs,
        bankAccounts,
        reference: displayRef || primaryBank?.ref,
        trans_no: stateTransNo ?? primaryBank?.trans_no,
        trans_type: stateTransType ?? primaryBank?.type,
        formLines: (stateLines as BankingFormLine[]) || undefined,
        bankAccountId: (bankAccountId as string | number) ?? (bankFrom as string | number),
        transactionKind: kind,
        date: displayDate,
      }),
    [
      bankTrans,
      journals,
      chartMasters,
      sysPrefs,
      bankAccounts,
      displayRef,
      primaryBank,
      stateTransNo,
      stateTransType,
      stateLines,
      bankAccountId,
      bankFrom,
      kind,
      displayDate,
    ]
  );

  const { groups, isLoading } = useGlPostingsGroups(
    {
      trans_no: primaryBank?.trans_no ?? stateTransNo,
      trans_type: primaryBank?.type ?? stateTransType,
    },
    fallbackGroups
  );

  const transType = primaryBank?.type ?? stateTransType;
  const pageTitle = primaryBank
    ? `${BANKING_TRANS_TYPE_LABELS[Number(primaryBank.type)] ?? "Transaction"} — ${primaryBank.ref ?? displayRef}`
    : displayRef
      ? `GL Postings — ${displayRef}`
      : "Banking GL Postings";

  return (
    <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Banking & GL", href: "/bankingandgeneralledger" },
        { title: "Transactions", href: "/bankingandgeneralledger/transactions" },
        { title: "GL Postings" },
      ]}
      pageTitle={pageTitle}
      reference={displayRef || primaryBank?.ref}
      transactionDate={
        displayDate ||
        (primaryBank?.trans_date ? String(primaryBank.trans_date).split("T")[0] : undefined)
      }
      transNo={primaryBank?.trans_no ?? stateTransNo}
      transTypeLabel={
        transType != null
          ? BANKING_TRANS_TYPE_LABELS[Number(transType)] ?? String(transType)
          : kind
            ? kind.charAt(0).toUpperCase() + kind.slice(1)
            : undefined
      }
      groups={groups}
      isLoading={isLoading}
      emptyMessage={
        hasLookupContext
          ? "No GL postings were found for this transaction. If you just saved it, refresh the page. You can also search in Banking & GL → Inquiries & Reports → GL Inquiry."
          : "No transaction context was provided. Open GL Postings from a transaction row (Payments, Deposits, Journal Inquiry, or Bank Account Inquiry)."
      }
      autoPrint={Boolean(autoPrintFlag)}
    />
  );
}
