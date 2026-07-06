<?php

namespace App\Support;

/**
 * FrontAccounting-aligned balances driven by Chart Class → Account Group (chart_types).
 *
 * Debit-normal (Assets, Expenses):  Balance = Debit − Credit
 * Credit-normal (Liabilities, Equity, Income): Balance = Credit − Debit
 */
class TrialAccountBalance
{
    /** @var int[] Fallback when chart_types metadata is unavailable */
    public const DEBIT_NORMAL_TYPES = [1, 2, 3, 10, 11, 12];

    /** @var int[] */
    public const CREDIT_NORMAL_TYPES = [4, 5, 6, 7, 8, 9];

    /** @var int[] */
    public const BALANCE_SHEET_TYPES = [1, 2, 3, 4, 5, 6, 7];

    public static function isDebitNormal(int|string $accountType): bool
    {
        return ChartAccountMetadata::isDebitNormal($accountType);
    }

    public static function isCreditNormal(int|string $accountType): bool
    {
        return ChartAccountMetadata::isCreditNormal($accountType);
    }

    public static function isBalanceSheetAccount(int|string $accountType): bool
    {
        return ChartAccountMetadata::isBalanceSheetAccount($accountType);
    }

    public static function isProfitAndLossAccount(int|string $accountType): bool
    {
        return ChartAccountMetadata::isProfitAndLossAccount($accountType);
    }

    /**
     * Signed account balance from GL debit/credit totals.
     */
    public static function signedBalance(float $debit, float $credit, int|string $accountType): float
    {
        $raw = $debit - $credit;

        if (self::isCreditNormal($accountType)) {
            return -$raw;
        }

        return $raw;
    }

    /**
     * Split signed balance into Trial Balance Debit / Credit display columns.
     *
     * @return array{0: float, 1: float} [debitColumn, creditColumn]
     */
    public static function toDebitCreditColumns(float $signedBalance, int|string $accountType): array
    {
        if (abs($signedBalance) < 0.001) {
            return [0.0, 0.0];
        }

        $amount = round(abs($signedBalance), 2);

        if (self::isDebitNormal($accountType)) {
            return $signedBalance > 0 ? [$amount, 0.0] : [0.0, $amount];
        }

        return $signedBalance > 0 ? [0.0, $amount] : [$amount, 0.0];
    }

    /**
     * Balance sheet presentation amount from raw GL signed (debit − credit).
     */
    public static function balanceSheetAmount(float $debitMinusCredit, int|string $accountType): float
    {
        if (! self::isBalanceSheetAccount($accountType)) {
            return 0.0;
        }

        if (self::isDebitNormal($accountType)) {
            return $debitMinusCredit;
        }

        return -$debitMinusCredit;
    }

    /**
     * Balance sheet roll-up: assets, liabilities, or equity (by account group within BS classes).
     */
    public static function balanceSheetCategory(int|string $accountType): ?string
    {
        return match ((int) $accountType) {
            1, 2, 3 => 'assets',
            4, 5 => 'liabilities',
            6, 7 => 'equity',
            default => null,
        };
    }

    /**
     * Balance sheet roll-up using Chart Class when available (FrontAccounting hierarchy).
     */
    public static function balanceSheetCategoryForAccount(int|string $accountType): ?string
    {
        $meta = ChartAccountMetadata::forAccountType($accountType);
        if ($meta && ($meta['class_id'] ?? '') !== '') {
            if ($meta['class_id'] === '1') {
                return 'assets';
            }
            if ($meta['class_id'] === '2') {
                return in_array((int) $accountType, [6, 7], true) ? 'equity' : 'liabilities';
            }

            return null;
        }

        return self::balanceSheetCategory($accountType);
    }

    /**
     * Balance sheet display section from GL Account Group (chart_types.id).
     */
    public static function balanceSheetSection(int|string $accountType): ?string
    {
        return match ((int) $accountType) {
            3 => 'capital_assets',
            1, 2 => 'current_assets',
            5 => 'long_term_liabilities',
            4 => 'current_liabilities',
            6 => 'share_capital',
            7 => 'retained_earnings',
            default => null,
        };
    }
}
