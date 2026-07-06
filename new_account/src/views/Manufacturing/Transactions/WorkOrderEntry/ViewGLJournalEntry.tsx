import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GLJournalEntriesPage from "../../../../components/GLJournalEntries/GLJournalEntriesPage";
import { searchWorkOrders } from "../../../../api/WorkOrders/WorkOrderApi";
import { getJournals } from "../../../../api/Journals/JournalApi";
import { getChartMasters } from "../../../../api/GLAccounts/ChartMasterApi";
import { getSysPrefs } from "../../../../api/OrganizationSettings/SysPrefsApi";
import { chartByCodeMap, pairGlLines, prefValue } from "../../../../utils/glJournalLinesCore";
import { referencesEqual } from "../../../../utils/exactReference";
import { useGlPostingsGroups } from "../../../../hooks/useGlPostingsGroups";

function isTruthyFlag(value: unknown): boolean {
  return value === true || String(value) === "1" || String(value).toLowerCase() === "true";
}

function workOrderEmptyGlMessage(workOrder: Record<string, unknown> | null | undefined): string {
  if (!workOrder) {
    return "No GL journal entries were found for this reference. Confirm the work order exists and manufacturing steps have been posted.";
  }

  const type = Number(workOrder.type ?? 0);
  const released = isTruthyFlag(workOrder.released);
  const closed = isTruthyFlag(workOrder.closed);

  if (type === 2 && !released) {
    return "This Advanced Manufacture work order is not released yet. GL is posted when you Release, add Costs, Issue materials, and Produce from Outstanding Work Orders.";
  }

  if (type === 2 && released && !closed) {
    return "This work order is released but not produced/closed yet. Complete Produce (and optional Issue/Costs) from Outstanding Work Orders to generate GL entries.";
  }

  if (!closed) {
    return "No GL has been posted for this open work order yet. Complete the manufacturing steps (Release, Issue, Costs, Produce) first.";
  }

  return "No GL journal entries were found. If components have zero material cost, production GL (type 29) is skipped; labour/overhead and close GL may still exist. Set material costs on BOM components or receive stock via GRN.";
}

export default function ViewGLJournalEntry() {
  const { state } = useLocation();
  const { reference } = (state as Record<string, unknown>) || {};
  const displayRef = reference ? String(reference) : "";

  const { data: workOrderMatches = [] } = useQuery({
    queryKey: ["workOrderByRef", displayRef],
    queryFn: () => searchWorkOrders({ reference: displayRef }),
    enabled: !!displayRef,
  });

  const workOrder = useMemo(() => {
    if (!displayRef) return null;
    if (Array.isArray(workOrderMatches) && workOrderMatches.length > 0) {
      return workOrderMatches.find((w: any) =>
        referencesEqual(String(w.wo_ref ?? ""), displayRef)
      ) ?? workOrderMatches[0];
    }
    return null;
  }, [workOrderMatches, displayRef]);

  const emptyMessage = useMemo(() => workOrderEmptyGlMessage(workOrder), [workOrder]);

  const { data: journals = [] } = useQuery({ queryKey: ["journals"], queryFn: getJournals });
  const { data: chartMasters = [] } = useQuery({ queryKey: ["chartMasters"], queryFn: getChartMasters });
  const { data: sysPrefs = [] } = useQuery({ queryKey: ["sysPrefs"], queryFn: getSysPrefs });

  const fallbackGroups = useMemo(() => {
    const chartByCode = chartByCodeMap(chartMasters);
    const inventory = prefValue(sysPrefs, "inventoryAccount", "1510");
    const wip = prefValue(sysPrefs, "workInProgressAccount", inventory);
    const mfgVar = prefValue(sysPrefs, "manufacturingVarianceAccount", "5020");
    const refKey = String(displayRef || "").trim();
    const linesByGroup: any[] = [];

    (journals || []).forEach((j: any) => {
      const jRef = String(j.reference ?? j.source_ref ?? "").trim();
      if (!refKey) return;
      if (!jRef || !referencesEqual(jRef, refKey)) return;

      const transType = Number(j.type);
      const transNo = Number(j.trans_no);
      const amount = Math.abs(Number(j.amount) || 0);
      if (amount <= 0) return;

      const tranDate = j.tran_date ? String(j.tran_date).split("T")[0] : "";
      const transactionLabel = `Work Order Journal #${transNo}`;

      const lines = pairGlLines({
        journalDate: tranDate,
        transaction: transactionLabel,
        debitAccount: inventory,
        creditAccount: transType === 0 ? mfgVar : wip,
        amount,
        memo: jRef || "Manufacturing transaction",
        chartByCode,
      });

      if (lines.length > 0) {
        linesByGroup.push({
          transType,
          transNo,
          reference: jRef,
          tranDate,
          title: transactionLabel,
          lines,
        });
      }
    });

    return linesByGroup;
  }, [journals, chartMasters, sysPrefs, displayRef]);

  const { groups, isLoading } = useGlPostingsGroups(
    { module: "manufacturing", reference: displayRef || undefined },
    fallbackGroups
  );

  return (
    <GLJournalEntriesPage
      breadcrumbs={[
        { title: "Manufacturing", href: "/manufacturing" },
        { title: "Transactions", href: "/manufacturing/transactions" },
        { title: "GL Journal Entries" },
      ]}
      pageTitle={displayRef ? `Work Order GL Journal Entries — ${displayRef}` : "Work Order GL Journal Entries"}
      reference={displayRef || undefined}
      transactionDate={workOrder?.date ? String(workOrder.date).split("T")[0] : undefined}
      transNo={workOrder?.id ?? workOrder?.wo_id}
      transTypeLabel="Manufacturing Work Order"
      groups={groups}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    />
  );
}
