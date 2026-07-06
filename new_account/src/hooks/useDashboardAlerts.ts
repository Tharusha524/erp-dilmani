import { useQuery } from "@tanstack/react-query";
import { getDashboardAlerts } from "../api/Dashboard/DashboardApi";

export function useDashboardAlerts() {
  const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  return useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: getDashboardAlerts,
    enabled: hasToken,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
