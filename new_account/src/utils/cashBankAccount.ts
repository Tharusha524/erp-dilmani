export function bankAccountTypeId(acc: any): number {
  const raw = acc?.account_type ?? acc?.accountType;
  if (raw == null) return 0;
  if (typeof raw === "number" || typeof raw === "string") return Number(raw) || 0;
  if (typeof raw === "object") return Number(raw.id) || 0;
  return 0;
}

export function isCashBankAccount(acc: any): boolean {
  const typeId = bankAccountTypeId(acc);
  if (typeId === 4) return true;
  const typeName = String(
    acc?.accountType?.type_name ?? acc?.account_type?.type_name ?? ""
  ).toLowerCase();
  return typeName.includes("cash");
}

export function bankAccountLabel(acc: any): string {
  const name = acc?.bank_account_name ?? acc?.name ?? "";
  const gl = acc?.account_gl_code ?? acc?.accountGl?.account_code ?? "";
  return gl ? `${name} (${gl})` : String(name);
}

export function bankAccountTypeName(acc: any): string {
  return String(
    acc?.accountType?.type_name ?? acc?.account_type?.type_name ?? ""
  ).trim();
}

/** All active bank/cash accounts usable as payment source (incl. petty cash). */
export function isPaymentSourceBankAccount(acc: any): boolean {
  return !acc?.inactive;
}

export function sortPaymentSourceAccounts(bankAccounts: any[]): any[] {
  const active = (bankAccounts || []).filter(isPaymentSourceBankAccount);
  const cash = active.filter(isCashBankAccount);
  const current = active.filter((acc) => !isCashBankAccount(acc) && isCurrentBankAccount(acc));
  const savings = active.filter((acc) => {
    if (isCashBankAccount(acc) || isCurrentBankAccount(acc)) return false;
    return bankAccountTypeId(acc) === 1;
  });
  const rest = active.filter(
    (acc) =>
      !isCashBankAccount(acc) &&
      !isCurrentBankAccount(acc) &&
      bankAccountTypeId(acc) !== 1
  );
  return [...cash, ...current, ...savings, ...rest];
}

export function groupPaymentSourceAccounts(bankAccounts: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const acc of sortPaymentSourceAccounts(bankAccounts)) {
    const label = bankAccountTypeName(acc) || "Other";
    if (!groups[label]) groups[label] = [];
    groups[label].push(acc);
  }
  return groups;
}

export function formatSignedBalance(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value > 0 ? `+ ${formatted}` : formatted;
}

export function bankAccountLabelWithBalance(
  acc: any,
  balance?: number | null
): string {
  const base = bankAccountLabel(acc);
  if (balance == null || Number.isNaN(Number(balance))) return base;
  return `${base} (${formatSignedBalance(balance)})`;
}

export function balanceByBankAccountId(
  accounts: Array<{ id: number; book_balance?: number }> | undefined
): Map<string, number> {
  const map = new Map<string, number>();
  (accounts ?? []).forEach((row) => {
    map.set(String(row.id), Number(row.book_balance ?? 0));
  });
  return map;
}

export function sortCashBankAccounts(bankAccounts: any[]): any[] {
  return sortPaymentSourceAccounts(bankAccounts);
}

/** Chequing / current bank account (type 2). */
export function isCurrentBankAccount(acc: any): boolean {
  const typeId = bankAccountTypeId(acc);
  if (typeId === 2) return true;
  const typeName = bankAccountTypeName(acc).toLowerCase();
  return (
    typeName.includes("chequing") ||
    typeName.includes("checking") ||
    typeName.includes("current")
  );
}

export function defaultPaymentSourceAccountId(bankAccounts: any[]): string {
  const sorted = sortPaymentSourceAccounts(bankAccounts);
  const preferred = sorted.find(isCurrentBankAccount) ?? sorted[0];
  return preferred?.id != null ? String(preferred.id) : "";
}

export { relationId } from "./relationId";
