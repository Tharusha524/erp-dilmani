<?php

namespace App\Support;

/**
 * Convert posted gl_trans (positive Debit OR Credit) back to Journal Entry form columns (+/−).
 */
class JournalEntryDisplay
{
    /**
     * @return array{debit: float, credit: float}
     */
    public static function postedGlToJournalColumns(
        float $postedDebit,
        float $postedCredit,
        int|string $accountType = 0
    ): array {
        $type = (int) $accountType;
        $debit = round($postedDebit, 2);
        $credit = round($postedCredit, 2);

        // Posted debit on liability/income (not equity): was −Credit in the entry form.
        if ($debit > 0.001 && $credit <= 0.001) {
            if (
                TrialAccountBalance::isCreditNormal($type)
                && ! in_array($type, [6, 7], true)
            ) {
                return ['debit' => 0.0, 'credit' => -$debit];
            }

            return ['debit' => $debit, 'credit' => 0.0];
        }

        // Posted credit always stays in the Credit column (opening balances, payables, etc.).
        if ($credit > 0.001 && $debit <= 0.001) {
            return ['debit' => 0.0, 'credit' => $credit];
        }

        return ['debit' => $debit, 'credit' => $credit];
    }
}
