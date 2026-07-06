<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GlAccountResolver
{
    /** @var array<string, array{string, string[]}> */
    private const ACCOUNT_PREFS = [
        'receivableAccount' => ['1200', ['%Receivable%']],
        'payableAccount' => ['2100', ['%Payable%']],
        'salesAccount' => ['4010', ['%Sales%']],
        'inventoryAccount' => ['1510', ['%Inventory%']],
        'cogsAccount' => ['5010', ['%Cost of Goods%', '%COGS%']],
        'retainedEarnings' => ['3590', ['%Retained Earnings%', '%RETAINED EARNINGS%']],
        'grnClearingAccount' => ['1550', ['%GRN%', '%Clearing%']],
        'lossOnAssetDisposalAccount' => ['5660', ['%disposal%', '%Disposal%', '%Amortization%']],
        'profitLossYear' => ['9990', ['%Profit%Loss%Year%']],
        'exchangeVariancesAccount' => ['4450', ['%Exchange%']],
        'bankChargesAccount' => ['5690', ['%Bank Charge%']],
        'shippingChargedAccount' => ['4430', ['%Shipping%']],
        'deferredIncomeAccount' => ['2105', ['%Deferred%']],
        'salesDiscountAccount' => ['4510', ['%Discounts Given%', '%Sales Discount%']],
        'promptPaymentDiscountAccount' => ['4510', ['%Discounts Given%', '%Payment Discount%', '%Prompt Payment%']],
        'purchaseDiscountAccount' => ['5040', ['%Purchase Discount%']],
        'itemSalesAccount' => ['4010', ['%Sales%']],
        'inventoryAdjustmentsAccount' => ['5020', ['%Inventory%Adjust%']],
        'wipAccount' => ['1530', ['%WIP%', '%Work In Process%']],
    ];

    public static function resolve(string $prefName, ?string $currentValue = null): ?string
    {
        if (!Schema::hasTable('chart_master')) {
            return $currentValue;
        }

        $preferred = self::ACCOUNT_PREFS[$prefName][0] ?? $currentValue;
        $patterns = self::ACCOUNT_PREFS[$prefName][1] ?? [];

        $preferDefaultFirst = in_array($prefName, [
            'salesDiscountAccount',
            'promptPaymentDiscountAccount',
            'purchaseDiscountAccount',
        ], true);

        $candidates = array_filter(
            $preferDefaultFirst ? [$preferred, $currentValue] : [$currentValue, $preferred]
        );
        foreach ($candidates as $code) {
            if ($code && self::exists($code) && self::isValidForPref($prefName, $code)) {
                return $code;
            }
        }

        foreach ($patterns as $pattern) {
            $found = DB::table('chart_master')
                ->where('inactive', 0)
                ->where('account_name', 'like', $pattern)
                ->orderBy('account_code')
                ->value('account_code');
            if ($found && self::isValidForPref($prefName, $found)) {
                return $found;
            }
        }

        return self::fallbackFor($prefName, $currentValue, $preferred);
    }

    private static function fallbackFor(string $prefName, ?string $currentValue, ?string $preferred): ?string
    {
        $related = match ($prefName) {
            'grnClearingAccount' => 'inventoryAccount',
            'lossOnAssetDisposalAccount' => 'cogsAccount',
            'itemSalesAccount' => 'salesAccount',
            'promptPaymentDiscountAccount', 'salesDiscountAccount' => 'salesDiscountAccount',
            default => null,
        };

        if ($related) {
            $relatedValue = DB::table('sys_prefs')->where('name', $related)->value('value');
            if ($relatedValue && self::exists($relatedValue)) {
                return $relatedValue;
            }
        }

        if ($prefName === 'lossOnAssetDisposalAccount') {
            $expense = DB::table('chart_master')
                ->where('inactive', 0)
                ->whereIn('account_type', ['12', '11'])
                ->orderBy('account_code')
                ->value('account_code');
            if ($expense) {
                return $expense;
            }
        }

        return $currentValue ?: $preferred;
    }

    public static function syncAllPrefs(): int
    {
        if (!Schema::hasTable('sys_prefs')) {
            return 0;
        }

        $updated = 0;
        foreach (array_keys(self::ACCOUNT_PREFS) as $name) {
            $current = DB::table('sys_prefs')->where('name', $name)->value('value');
            $resolved = self::resolve($name, $current);
            if ($resolved && $resolved !== $current) {
                DB::table('sys_prefs')->where('name', $name)->update([
                    'value' => $resolved,
                    'updated_at' => now(),
                ]);
                $updated++;
            }
        }

        return $updated;
    }

    private static function exists(string $code): bool
    {
        return DB::table('chart_master')
            ->where('account_code', $code)
            ->where('inactive', 0)
            ->exists();
    }

    private static function isValidForPref(string $prefName, string $code): bool
    {
        $name = (string) DB::table('chart_master')->where('account_code', $code)->value('account_name');

        return match ($prefName) {
            'salesDiscountAccount', 'promptPaymentDiscountAccount' => ChartAccountMetadata::isDiscountGivenAccount($name),
            'purchaseDiscountAccount' => ChartAccountMetadata::isDiscountAllowedIncomeAccount($name)
                || (bool) preg_match('/\bDISCOUNT\b/i', $name),
            'cogsAccount' => self::isCogsAccountName($name),
            'deferredIncomeAccount' => (bool) preg_match('/\bDEFERRED\b/i', $name),
            default => true,
        };
    }

    public static function isCogsAccountName(string $accountName): bool
    {
        $name = strtoupper(trim($accountName));
        if ($name === '') {
            return false;
        }
        if (str_contains($name, 'COMMISSION')) {
            return false;
        }

        return (bool) preg_match('/\bCOGS\b|COST OF GOODS/i', $name);
    }
}
