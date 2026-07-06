import { useQuery } from "@tanstack/react-query";
import { getCostCenters, CostCenterRecord } from "../api/CostCenter/CostCenterApi";

export function useCostCenters(type?: number) {
  return useQuery({
    queryKey: ["costCenters", type ?? "all"],
    queryFn: getCostCenters,
    select: (data: CostCenterRecord[]) => {
      if (type == null) return data;
      return data.filter((d) => Number(d.type) === Number(type));
    },
  });
}

export function costCenterLabel(d: CostCenterRecord): string {
  const ref = d.reference ? `${d.reference} — ` : "";
  return `${ref}${d.name}`;
}
