import { useQuery } from "@tanstack/react-query";
import { getDimensions, DimensionRecord } from "../api/Dimension/DimensionApi";

export function useDimensions(type?: number) {
  return useQuery({
    queryKey: ["dimensions", type ?? "all"],
    queryFn: getDimensions,
    select: (data: DimensionRecord[]) => {
      if (type == null) return data;
      return data.filter((d) => Number(d.type) === Number(type));
    },
  });
}

export function dimensionLabel(d: DimensionRecord): string {
  const ref = d.reference ? `${d.reference} — ` : "";
  return `${ref}${d.name}`;
}
