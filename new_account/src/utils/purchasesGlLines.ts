import { prefValue } from "./glJournalLinesCore";

export interface UserGlLine {
  gl_code: string;
  amount: number;
  memo?: string;
  dimension_id?: number;
}

const AUTO_MEMOS = new Set([
  "Clear GRN clearing",
  "Accounts payable",
  "Reverse GRN clearing",
  "Reverse accounts payable",
]);

export function extractUserGlLines(
  glRows: Array<{ account?: string; amount?: number; memo?: string; dimension?: string | number }>,
  sysPrefs: unknown[],
  options?: { skipClearing?: boolean; skipPayable?: boolean }
): UserGlLine[] {
  const clearingCode = prefValue(sysPrefs as never[], "grnClearingAccount", "2201");
  const payableCode = prefValue(sysPrefs as never[], "payableAccount", "1500");
  const skipClearing = options?.skipClearing !== false;
  const skipPayable = options?.skipPayable !== false;

  return glRows
    .filter((row) => {
      const account = String(row.account ?? "").trim();
      const amount = Number(row.amount ?? 0);
      if (!account || Math.abs(amount) < 0.001) return false;
      if (skipClearing && account === clearingCode) return false;
      if (skipPayable && account === payableCode) return false;
      if (row.memo && AUTO_MEMOS.has(String(row.memo))) return false;
      return true;
    })
    .map((row) => ({
      gl_code: String(row.account),
      amount: Number(row.amount),
      memo: row.memo ? String(row.memo) : undefined,
      dimension_id:
        row.dimension != null && row.dimension !== ""
          ? Number(row.dimension)
          : undefined,
    }));
}
