export interface GlJournalLine {
  id: string;
  journalDate: string;
  transaction: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
}

export interface GlTransactionGroup {
  transType: number;
  transNo: number;
  reference: string;
  tranDate: string;
  title: string;
  lines: GlJournalLine[];
}

export function prefValue(
  sysPrefs: { name: string; value: string }[],
  name: string,
  fallback = ""
): string {
  return sysPrefs.find((p) => p.name === name)?.value?.trim() || fallback;
}

export function chartByCodeMap(chartMasters: any[]): Map<string, { account_name?: string }> {
  const map = new Map<string, { account_name?: string }>();
  chartMasters.forEach((c: any) => {
    const code = String(c.account_code ?? c.id ?? "");
    if (code) map.set(code, c);
  });
  return map;
}

function accountLabel(
  code: string,
  chartByCode: Map<string, { account_name?: string }>
): { code: string; name: string } {
  const rec = chartByCode.get(String(code));
  return {
    code: String(code),
    name: rec?.account_name ? String(rec.account_name) : String(code),
  };
}

export function pairGlLines(
  base: {
    journalDate: string;
    transaction: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    memo: string;
    chartByCode: Map<string, { account_name?: string }>;
  }
): GlJournalLine[] {
  const amt = Math.abs(Number(base.amount) || 0);
  if (amt <= 0) return [];
  const debit = accountLabel(base.debitAccount, base.chartByCode);
  const credit = accountLabel(base.creditAccount, base.chartByCode);
  return [
    {
      id: `${base.transaction}-d`,
      journalDate: base.journalDate,
      transaction: base.transaction,
      accountCode: debit.code,
      accountName: debit.name,
      debit: amt,
      credit: 0,
      memo: base.memo,
    },
    {
      id: `${base.transaction}-c`,
      journalDate: base.journalDate,
      transaction: base.transaction,
      accountCode: credit.code,
      accountName: credit.name,
      debit: 0,
      credit: amt,
      memo: base.memo,
    },
  ];
}

export function flattenGlLines(groups: GlTransactionGroup[]): GlJournalLine[] {
  return groups.flatMap((g) => g.lines);
}

export function resolveBankGlCode(
  bankTransList: any[],
  bankAccounts: any[],
  transType: number,
  transNo: number,
  fallback: string
): string {
  const bt = (bankTransList || []).find(
    (b: any) => Number(b.type) === transType && Number(b.trans_no) === transNo
  );
  const bankActId = bt?.bank_act ?? bt?.bank_account_id;
  const bankRec = (bankAccounts || []).find(
    (ba: any) =>
      String(ba.id) === String(bankActId) ||
      String(ba.bank_account_id) === String(bankActId)
  );
  return (
    bankRec?.account_gl_code ??
    bankRec?.gl_code ??
    bankRec?.account_code ??
    fallback
  );
}
