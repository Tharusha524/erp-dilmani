/** First and last calendar dates for YYYY-MM. */
export function monthDateBounds(yyyyMm: string): { fromDate: string; toDate: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");

  return {
    fromDate: `${year}-${mm}-01`,
    toDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export interface MonthOption {
  value: string;
  label: string;
}

/** Months from fiscal year start through end (inclusive). */
export function monthsInFiscalYear(fiscalFrom: string, fiscalTo: string): MonthOption[] {
  if (!fiscalFrom || !fiscalTo) return [];

  const start = new Date(`${fiscalFrom}T00:00:00`);
  const end = new Date(`${fiscalTo}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  const options: MonthOption[] = [];

  while (cursor <= endMonth) {
    const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    options.push({
      value,
      label: cursor.toLocaleDateString("en-LK", { month: "long", year: "numeric" }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return options;
}

/** Current YYYY-MM if inside range, otherwise first month of fiscal year. */
export function defaultMonthInFiscalYear(fiscalFrom: string, fiscalTo: string): string {
  const options = monthsInFiscalYear(fiscalFrom, fiscalTo);
  if (options.length === 0) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  }

  const today = new Date();
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (options.some((o) => o.value === current)) {
    return current;
  }

  return options[0].value;
}

export function formatMonthLabel(yyyyMm: string): string {
  const bounds = monthDateBounds(yyyyMm);
  if (!bounds) return yyyyMm;
  const d = new Date(`${bounds.fromDate}T00:00:00`);
  return d.toLocaleDateString("en-LK", { month: "long", year: "numeric" });
}
