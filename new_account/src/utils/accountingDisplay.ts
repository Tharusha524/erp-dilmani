export function formatAccountingAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSignedAccountingAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  if (n < -0.001) return `-${formatAccountingAmount(Math.abs(n))}`;
  return formatAccountingAmount(n);
}

/** FrontAccounting-style statement amounts (whole numbers, comma separated). */
export function formatStatementAmount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n) || Math.abs(n) < 0.001) return "0";
  const abs = Math.abs(Math.round(n)).toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-${abs}` : abs;
}

/** Achieved % — FrontAccounting shows 999.0 when compare column is zero. */
export function plAchievePercent(period: number, compare: number): string {
  if (Math.abs(compare) < 0.001) return "999.0";
  return ((period / compare) * 100).toFixed(1);
}
