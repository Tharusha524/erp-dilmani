/** Comma-separated amount: 10 → 10.00, 1000 → 1,000.00 */
export function formatTransactionAmount(
  value: number | string | null | undefined,
  decimals = 2
): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Amount with currency code prefix: USD 10,000.00 / LKR 1,234.56 */
export function formatTransactionMoney(
  value: number | string | null | undefined,
  currencyCode?: string | null,
  decimals = 2
): string {
  const formatted = formatTransactionAmount(value, decimals);
  const code = String(currencyCode ?? "")
    .trim()
    .toUpperCase();
  return code ? `${code} ${formatted}` : formatted;
}
