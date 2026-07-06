export interface FiscalYearLike {
  fiscal_year_from?: string;
  fiscal_year_to?: string;
  reference_suffix?: string;
}

/** Suffix used in references, e.g. 2025 or 2025-2026 for Apr–Mar fiscal years. */
export function getFiscalYearReferenceSuffix(fiscalYear?: FiscalYearLike | null): string {
  if (!fiscalYear?.fiscal_year_from || !fiscalYear?.fiscal_year_to) {
    return String(new Date().getFullYear());
  }

  if (fiscalYear.reference_suffix) {
    return fiscalYear.reference_suffix;
  }

  const fromYear = new Date(fiscalYear.fiscal_year_from).getFullYear();
  const toYear = new Date(fiscalYear.fiscal_year_to).getFullYear();

  return fromYear === toYear ? String(fromYear) : `${fromYear}-${toYear}`;
}

export function parseReferenceSequence(reference: string, suffix: string): number {
  const pattern = new RegExp(`^(\\d+)\\/${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  const match = String(reference).trim().match(pattern);
  return match ? parseInt(match[1], 10) || 0 : 0;
}

export function buildNextReferenceFromExisting(
  existingReferences: string[],
  suffix: string,
  padding = 3
): string {
  const maxSequence = existingReferences.reduce((max, ref) => {
    return Math.max(max, parseReferenceSequence(ref, suffix));
  }, 0);

  const next = maxSequence + 1;
  return `${String(next).padStart(padding, "0")}/${suffix}`;
}

export function referenceMatchesFiscalYearSuffix(reference: string, suffix: string): boolean {
  return parseReferenceSequence(reference, suffix) > 0;
}

export function filterReferencesForFiscalYear(
  records: Array<{ reference?: string | null; trans_type?: number; type?: number; tran_date?: string; ord_date?: string }>,
  transType: number,
  fiscalYear: FiscalYearLike,
  dateField: "tran_date" | "ord_date" = "tran_date"
): string[] {
  const suffix = getFiscalYearReferenceSuffix(fiscalYear);
  const from = fiscalYear.fiscal_year_from ? new Date(fiscalYear.fiscal_year_from) : null;
  const to = fiscalYear.fiscal_year_to ? new Date(fiscalYear.fiscal_year_to) : null;

  return records
    .filter((record) => {
      const typeValue = record.trans_type ?? record.type;
      if (typeValue !== undefined && Number(typeValue) !== Number(transType)) {
        return false;
      }

      const ref = record.reference ? String(record.reference) : "";
      if (!referenceMatchesFiscalYearSuffix(ref, suffix)) {
        return false;
      }

      if (from && to) {
        const rawDate = record[dateField];
        if (rawDate) {
          const value = new Date(rawDate);
          if (value < from || value > to) {
            return false;
          }
        }
      }

      return true;
    })
    .map((record) => String(record.reference));
}
