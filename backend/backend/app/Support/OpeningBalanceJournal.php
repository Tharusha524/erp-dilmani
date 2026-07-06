<?php

namespace App\Support;

/**
 * Opening balance journal: gross GL debits = credits, but Balance Sheet uses net signed amounts.
 * Retained earnings loss (type 7) is entered as Debit → negative equity on the balance sheet.
 */
class OpeningBalanceJournal
{
    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @return array{
     *   total_assets: float,
     *   total_liabilities: float,
     *   total_equity: float,
     *   liabilities_plus_equity: float,
     *   difference: float,
     *   equation_balanced: bool,
     *   gross_posted_debit: float,
     *   gross_posted_credit: float
     * }
     */
    public static function summarizeFromLines(array $lines, array $accountTypesByCode): array
    {
        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquity = 0.0;
        $grossDebit = 0.0;
        $grossCredit = 0.0;

        foreach ($lines as $line) {
            $code = trim((string) ($line['account_code'] ?? $line['accountCode'] ?? $line['selectedAccountCode'] ?? ''));
            if ($code === '') {
                continue;
            }

            $type = (int) ($accountTypesByCode[$code] ?? 0);
            if (! TrialAccountBalance::isBalanceSheetAccount($type)) {
                continue;
            }

            $debit = (float) ($line['debit'] ?? 0);
            $credit = (float) ($line['credit'] ?? 0);

            if ($debit < 0) {
                $credit += abs($debit);
                $debit = 0;
            }
            if ($credit < 0) {
                $debit += abs($credit);
                $credit = 0;
            }

            if ($debit <= 0 && $credit <= 0) {
                continue;
            }

            $grossDebit += $debit;
            $grossCredit += $credit;

            $glNet = $debit - $credit;
            $bsAmount = TrialAccountBalance::balanceSheetAmount($glNet, $type);

            match (self::categoryForAccount($type)) {
                'assets' => $totalAssets += $bsAmount,
                'liabilities' => $totalLiabilities += $bsAmount,
                'equity' => $totalEquity += $bsAmount,
                default => null,
            };
        }

        $liabEquity = $totalLiabilities + $totalEquity;
        $diff = $totalAssets - $liabEquity;

        return [
            'total_assets' => round($totalAssets, 2),
            'total_liabilities' => round($totalLiabilities, 2),
            'total_equity' => round($totalEquity, 2),
            'liabilities_plus_equity' => round($liabEquity, 2),
            'difference' => round($diff, 2),
            'equation_balanced' => abs($diff) < 0.01,
            'gross_posted_debit' => round($grossDebit, 2),
            'gross_posted_credit' => round($grossCredit, 2),
        ];
    }

    private static function categoryForAccount(int $accountType): ?string
    {
        if (method_exists(TrialAccountBalance::class, 'balanceSheetCategoryForAccount')) {
            return TrialAccountBalance::balanceSheetCategoryForAccount($accountType);
        }

        if (class_exists(ChartAccountMetadata::class)) {
            $meta = ChartAccountMetadata::forAccountType($accountType);
            if ($meta && ($meta['class_id'] ?? '') !== '') {
                if ($meta['class_id'] === '1') {
                    return 'assets';
                }
                if ($meta['class_id'] === '2') {
                    return in_array($accountType, [6, 7], true) ? 'equity' : 'liabilities';
                }

                return null;
            }
        }

        return TrialAccountBalance::balanceSheetCategory($accountType);
    }
}
