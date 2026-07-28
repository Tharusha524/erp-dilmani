import { format } from "date-fns";

/** ISO 8601 date (YYYY-MM-DD), used across the Work Order module. */
export const formatWoDate = (value: string | null | undefined): string =>
  value ? format(new Date(value), "yyyy-MM-dd") : "-";

/** ISO 8601 date + 24-hour time (YYYY-MM-DD HH:mm:ss), used across the Work Order module. */
export const formatWoDateTime = (value: string | null | undefined): string =>
  value ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "-";
