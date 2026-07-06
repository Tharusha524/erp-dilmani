import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGlTransByTransaction } from "../api/GlTrans/GlTransApi";
import { getChartClasses } from "../api/GLAccounts/ChartClassApi";
import { getChartTypes } from "../api/GLAccounts/ChartTypeApi";
import { GlTransactionGroup } from "../utils/glJournalLinesCore";
import { glTransRowsToGroups } from "../utils/glPostingsFromApi";
import { buildChartGroupMetaMap } from "../utils/trialAccountBalance";
import type { GlModule } from "../utils/exactReference";

export interface GlPostingsLookup {
  trans_no?: number | string | null;
  trans_type?: number | string | null;
  reference?: string;
  order_no?: number | string | null;
  purch_order_no?: number | string | null;
  module?: GlModule;
}

export function useGlPostingsGroups(
  lookup: GlPostingsLookup,
  fallbackGroups: GlTransactionGroup[] = []
) {
  const transNo =
    lookup.trans_no != null && lookup.trans_no !== "" ? lookup.trans_no : null;
  const transType =
    lookup.trans_type != null && lookup.trans_type !== ""
      ? lookup.trans_type
      : null;
  const reference = lookup.reference?.trim() || "";
  const orderNo =
    lookup.order_no != null && lookup.order_no !== "" ? lookup.order_no : null;
  const purchOrderNo =
    lookup.purch_order_no != null && lookup.purch_order_no !== ""
      ? lookup.purch_order_no
      : null;
  const module = lookup.module;
  const hasTransKey = transNo != null && transType != null;
  const enabled =
    hasTransKey ||
    !!reference ||
    orderNo != null ||
    purchOrderNo != null;

  const { data: chartTypes = [] } = useQuery({
    queryKey: ["chartTypes"],
    queryFn: getChartTypes,
    staleTime: 5 * 60 * 1000,
  });

  const { data: chartClasses = [] } = useQuery({
    queryKey: ["chartClasses"],
    queryFn: getChartClasses,
    staleTime: 5 * 60 * 1000,
  });

  const chartGroupMeta = useMemo(
    () => buildChartGroupMetaMap(chartTypes as any[], chartClasses as any[]),
    [chartTypes, chartClasses]
  );

  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["glTransByTransaction", transNo, transType, reference, orderNo, purchOrderNo, module],
    queryFn: () =>
      getGlTransByTransaction({
        trans_no: hasTransKey ? transNo ?? undefined : undefined,
        trans_type: hasTransKey ? transType ?? undefined : undefined,
        reference: reference || undefined,
        order_no: orderNo ?? undefined,
        purch_order_no: purchOrderNo ?? undefined,
        module,
      }),
    enabled,
    staleTime: 0,
  });

  const groups = useMemo(() => {
    const fromApi = glTransRowsToGroups(rows, chartGroupMeta);
    return fromApi.length > 0 ? fromApi : fallbackGroups;
  }, [rows, fallbackGroups, chartGroupMeta]);

  return { groups, isLoading: isFetching };
}
