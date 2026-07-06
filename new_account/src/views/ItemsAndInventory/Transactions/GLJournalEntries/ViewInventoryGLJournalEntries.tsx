import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { getStockMoves } from "../../../../api/StockMoves/StockMovesApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import {
  buildInventoryGlJournalGroups,
  INVENTORY_TRANS_TYPE_LABELS,
} from "../../../../utils/inventoryGlJournalLines";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";

export default function ViewInventoryGLJournalEntries() {
  const { state } = useLocation();
  const {
    reference,
    date,
    trans_no: stateTransNo,
    trans_type: stateTransType,
    type,
  } = (state as Record<string, unknown>) || {};

  const displayDate = date ? String(date) : "";
  const displayRef = reference ? String(reference) : "";
  const transType = stateTransType ?? type;

  const { data: stockMoves = [] } = useQuery({ queryKey: ["stockMoves"], queryFn: getStockMoves });
  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });

  const primaryMove = useMemo(() => {
    const list = stockMoves || [];
    if (stateTransNo != null) {
      return list.find(
        (m: any) =>
          Number(m.trans_no) === Number(stateTransNo) &&
          (transType == null || Number(m.type ?? m.trans_type) === Number(transType))
      );
    }
    if (displayRef) return list.find((m: any) => String(m.reference) === displayRef);
    return null;
  }, [stockMoves, stateTransNo, transType, displayRef]);

  const fallbackGroups = useMemo(
    () =>
      buildInventoryGlJournalGroups({
        stockMoves,
        journals,
        chartMasters,
        sysPrefs,
        reference: displayRef || primaryMove?.reference,
        trans_no: stateTransNo ?? primaryMove?.trans_no,
        trans_type: transType ?? primaryMove?.type ?? primaryMove?.trans_type,
      }),
    [stockMoves, journals, chartMasters, sysPrefs, displayRef, stateTransNo, transType, primaryMove]
  );

  const { groups, isLoading } = useGlPostingsGroups(
    {
      trans_no: primaryMove?.trans_no ?? stateTransNo,
      trans_type: transType ?? primaryMove?.type ?? primaryMove?.trans_type ?? 17,
    },
    fallbackGroups
  );

  const moveType = Number(
    transType ?? primaryMove?.type ?? primaryMove?.trans_type ?? 17
  );

  const pageTitle = primaryMove
    ? `${INVENTORY_TRANS_TYPE_LABELS[moveType] ?? "Stock transaction"} — ${primaryMove.reference ?? displayRef}`
    : displayRef
      ? `Reference ${displayRef}`
      : "Inventory GL Journal Entries";

  return (
    <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Items & Inventory", href: "/itemsandinventory" },
        { title: "Transactions", href: "/itemsandinventory/transactions" },
        { title: "GL Journal Entries" },
      ]}
      pageTitle={pageTitle}
      reference={displayRef || primaryMove?.reference}
      transactionDate={
        displayDate ||
        (primaryMove?.tran_date ? String(primaryMove.tran_date).split("T")[0] : undefined)
      }
      transNo={primaryMove?.trans_no ?? stateTransNo}
      transTypeLabel={INVENTORY_TRANS_TYPE_LABELS[moveType] ?? String(moveType)}
      groups={groups}
      isLoading={isLoading}
      emptyMessage="No GL journal entries were found for this inventory transaction. Adjustment entries use inventory and inventory adjustments accounts from Company GL Setup."
    />
  );
}
