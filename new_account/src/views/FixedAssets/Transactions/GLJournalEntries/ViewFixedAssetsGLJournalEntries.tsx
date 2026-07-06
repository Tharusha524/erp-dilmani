import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { getSuppTrans } from "../../../../api/SuppTrans/SuppTransApi";
import { getDebtorTrans } from "../../../../api/DebtorTrans/DebtorTransApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { getBankAccounts } from "../../../../api/BankAccount/BankAccountApi";
import { getBankTrans } from "../../../../api/BankTrans/BankTransApi";
import { buildFixedAssetsGlJournalGroups } from "../../../../utils/fixedAssetsGlJournalLines";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";

export default function ViewFixedAssetsGLJournalEntries() {
  const { state } = useLocation();
  const stateData = (state as Record<string, unknown>) || {};
  const reference = stateData.reference;
  const date = stateData.date;
  const orderNo = stateData.orderNo as string | number | null | undefined;

  const displayDate = date ? String(date) : "";
  const displayRef = reference ? String(reference) : "";

  const { data: suppTrans = [] } = useQuery({ queryKey: ["suppTrans"], queryFn: getSuppTrans });
  const { data: debtorTrans = [] } = useQuery({ queryKey: ["debtorTrans"], queryFn: getDebtorTrans });
  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });
  const { data: bankAccounts = [] } = useQuery({ queryKey: ["bankAccounts"], queryFn: getBankAccounts });
  const { data: bankTrans = [] } = useQuery({ queryKey: ["bankTrans"], queryFn: getBankTrans });

  const stateTransNo = stateData.trans_no as string | number | null | undefined;
  const stateTransType = stateData.trans_type as string | number | null | undefined;

  const fallbackGroups = useMemo(
    () =>
      buildFixedAssetsGlJournalGroups({
        suppTransList: suppTrans,
        debtorTransList: debtorTrans,
        journals,
        chartMasters,
        sysPrefs,
        bankAccounts,
        bankTransList: bankTrans,
        reference: displayRef,
        orderNo,
        transNo: stateTransNo,
        transType: stateTransType,
      }),
    [
      suppTrans,
      debtorTrans,
      journals,
      chartMasters,
      sysPrefs,
      bankAccounts,
      bankTrans,
      displayRef,
      orderNo,
      stateTransNo,
      stateTransType,
    ]
  );

  const { groups, isLoading } = useGlPostingsGroups(
    {
      module: "fixed_assets",
      reference: displayRef || undefined,
      trans_no: stateTransNo,
      trans_type: stateTransType,
    },
    fallbackGroups
  );

  const pageTitle = displayRef
    ? `Fixed Assets — ${displayRef}`
    : "Fixed Assets GL Journal Entries";

  return (
    <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Fixed Assets", href: "/fixedassets" },
        { title: "Transactions", href: "/fixedassets/transactions" },
        { title: "GL Journal Entries" },
      ]}
      pageTitle={pageTitle}
      reference={displayRef}
      transactionDate={displayDate}
      orderNo={orderNo}
      orderNoLabel="Reference Order #"
      groups={groups}
      isLoading={isLoading}
      emptyMessage="No GL journal entries were found. Fixed asset transactions use payable, inventory, sales, and loss-on-disposal accounts from Company GL Setup."
    />
  );
}
