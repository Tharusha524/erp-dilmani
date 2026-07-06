export function formatPrintMoney(
  value: number | string | null | undefined,
  currency?: string
): string {
  const n = Number(value);
  if (Number.isNaN(n)) {
    return currency ? `${currency} —` : "—";
  }
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

export function formatPrintDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const s = String(value).split("T")[0];
  return s || "—";
}
