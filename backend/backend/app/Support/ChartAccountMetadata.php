<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting chart hierarchy: GL Account Class → GL Account Group (chart_types) → GL Account.
 */
class ChartAccountMetadata
{
    /** @var array<int, array<string, mixed>>|null */
    private static ?array $byTypeId = null;

    public static function clearCache(): void
    {
        self::$byTypeId = null;
        ChartAccountTypeResolver::clearCache();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function typesById(): array
    {
        if (self::$byTypeId !== null) {
            return self::$byTypeId;
        }

        if (! Schema::hasTable('chart_types')) {
            self::$byTypeId = [];

            return self::$byTypeId;
        }

        $query = DB::table('chart_types as ct');
        if (Schema::hasTable('chart_class')) {
            $query->leftJoin('chart_class as cc', 'ct.class_id', '=', 'cc.cid');
        }

        self::$byTypeId = $query
            ->select(
                'ct.id',
                'ct.name',
                'ct.class_id',
                Schema::hasTable('chart_class') ? 'cc.class_name' : DB::raw("'' as class_name"),
                Schema::hasTable('chart_class') ? 'cc.ctype' : DB::raw('0 as ctype')
            )
            ->orderBy('ct.class_id')
            ->orderBy('ct.id')
            ->get()
            ->mapWithKeys(function ($row) {
                $id = (int) $row->id;

                return [
                    $id => [
                        'id' => $id,
                        'name' => (string) ($row->name ?? ''),
                        'class_id' => trim((string) ($row->class_id ?? '')),
                        'class_name' => (string) ($row->class_name ?? ''),
                        'class_ctype' => (int) ($row->ctype ?? 0),
                    ],
                ];
            })
            ->all();

        return self::$byTypeId;
    }

    public static function forAccountType(int|string $accountType): ?array
    {
        $id = (int) $accountType;
        if ($id <= 0) {
            return null;
        }

        return self::typesById()[$id] ?? null;
    }

    /**
     * FA chart_class.ctype: 1 & 6 = debit-normal (Assets, Costs); 2 & 4 = credit-normal.
     */
    public static function isDebitNormalCtype(int $classCtype): bool
    {
        return in_array($classCtype, [1, 6], true);
    }

    public static function isDebitNormal(int|string $accountType): bool
    {
        $meta = self::forAccountType($accountType);
        if ($meta && ($meta['class_ctype'] ?? 0) > 0) {
            return self::isDebitNormalCtype((int) $meta['class_ctype']);
        }

        return in_array((int) $accountType, TrialAccountBalance::DEBIT_NORMAL_TYPES, true);
    }

    public static function isCreditNormal(int|string $accountType): bool
    {
        return ! self::isDebitNormal($accountType);
    }

    /** Balance sheet = Assets class (1) + Liabilities class (2, includes equity groups). */
    public static function isBalanceSheetAccount(int|string $accountType): bool
    {
        $meta = self::forAccountType($accountType);
        if ($meta && ($meta['class_id'] ?? '') !== '') {
            return in_array($meta['class_id'], ['1', '2'], true);
        }

        return in_array((int) $accountType, TrialAccountBalance::BALANCE_SHEET_TYPES, true);
    }

    public static function isProfitAndLossAccount(int|string $accountType): bool
    {
        $type = (int) $accountType;
        $meta = self::forAccountType($accountType);

        if ($meta) {
            $ctype = (int) ($meta['class_ctype'] ?? 0);
            // chart_class.ctype: 4 = Income (credit-normal), 6 = Costs (debit-normal)
            if (in_array($ctype, [4, 6], true)) {
                return true;
            }

            $classId = trim((string) ($meta['class_id'] ?? ''));
            // Standard FA: 3=Income, 4=Expenses. This install also uses 5=Costs.
            if (in_array($classId, ['3', '4', '5'], true)) {
                return true;
            }
        }

        return in_array($type, [7, 8, 9, 10, 11, 12], true);
    }

    public static function isProfitAndLossIncomeAccount(int|string $accountType): bool
    {
        $meta = self::forAccountType($accountType);
        if ($meta) {
            if ((int) ($meta['class_ctype'] ?? 0) === 4) {
                return true;
            }

            return trim((string) ($meta['class_id'] ?? '')) === '3';
        }

        return in_array((int) $accountType, [7, 8], true);
    }

    public static function isProfitAndLossCostAccount(int|string $accountType): bool
    {
        if (! self::isProfitAndLossAccount($accountType)) {
            return false;
        }

        return ! self::isProfitAndLossIncomeAccount($accountType);
    }

    /**
     * Income side of P&L — chart_class INCOME (ctype 4 / class_id 3).
     *
     * @param  array<string, mixed>|int|string  $rowOrType
     */
    public static function isIncomeClassRow(array|int|string $rowOrType): bool
    {
        if (is_array($rowOrType)) {
            $classId = trim((string) ($rowOrType['classId'] ?? ''));
            if ($classId === '3') {
                return true;
            }
            if (in_array($classId, ['4', '5'], true)) {
                return false;
            }
        }

        $type = is_array($rowOrType) ? (int) ($rowOrType['account_type'] ?? 0) : (int) $rowOrType;
        $meta = self::forAccountType($type);
        if ($meta) {
            if ((int) ($meta['class_ctype'] ?? 0) === 4) {
                return true;
            }

            return trim((string) ($meta['class_id'] ?? '')) === '3';
        }

        return in_array($type, [7, 8], true);
    }

    /**
     * Cost / expense side of P&L — chart_class COSTS (ctype 6 / class_id 4 or 5).
     *
     * @param  array<string, mixed>|int|string  $rowOrType
     */
    public static function isCostClassRow(array|int|string $rowOrType): bool
    {
        if (is_array($rowOrType)) {
            $classId = trim((string) ($rowOrType['classId'] ?? ''));
            if (in_array($classId, ['4', '5'], true)) {
                return true;
            }
            if ($classId === '3') {
                return false;
            }
        }

        $type = is_array($rowOrType) ? (int) ($rowOrType['account_type'] ?? 0) : (int) $rowOrType;
        $meta = self::forAccountType($type);
        if ($meta) {
            if ((int) ($meta['class_ctype'] ?? 0) === 6) {
                return true;
            }

            return in_array(trim((string) ($meta['class_id'] ?? '')), ['4', '5'], true);
        }

        return in_array($type, [10, 11, 12], true);
    }

    /** GL Account Group is Cost of Goods Sold (for stock adjustment block). */
    public static function isCogsChartGroup(string $groupName): bool
    {
        $name = strtoupper(html_entity_decode($groupName, ENT_QUOTES | ENT_HTML5));

        return str_contains($name, 'COST OF GOODS') || str_contains($name, 'COGS');
    }

    /** GL Account Group is Sales Revenue within income class. */
    public static function isSalesRevenueGroup(string $groupName): bool
    {
        $name = strtoupper(html_entity_decode($groupName, ENT_QUOTES | ENT_HTML5));

        return str_contains($name, 'SALES REVENUE') || $name === 'SALES';
    }

    /** Other Revenue / Other Income — income class only (not cost class type 9). */
    public static function isOtherIncomeAccount(int|string $accountType): bool
    {
        $meta = self::forAccountType($accountType);
        if ($meta) {
            $classId = trim((string) ($meta['class_id'] ?? ''));
            if (in_array($classId, ['4', '5'], true)) {
                return false;
            }
            if ($classId === '3') {
                return ! self::isSalesRevenueGroup((string) ($meta['name'] ?? '')) && (int) $accountType !== 8;
            }
        }

        return (int) $accountType === 9;
    }

    /** Purchases & COGS — cost classes and chart group 10. */
    public static function isCogsPurchaseAccount(int|string $accountType): bool
    {
        $type = (int) $accountType;
        if (in_array($type, [11, 12], true)) {
            return false;
        }

        $meta = self::forAccountType($accountType);
        if ($meta) {
            $classId = trim((string) ($meta['class_id'] ?? ''));
            if (in_array($classId, ['4', '5'], true)) {
                $typeName = strtoupper(html_entity_decode((string) ($meta['name'] ?? ''), ENT_QUOTES | ENT_HTML5));

                return ! preg_match('/(PAYROLL|GENERAL|ADMINISTRATIVE|G&A)/', $typeName);
            }
        }

        return $type === 10;
    }

    /** Operating expenses — payroll, G&A groups (not COGS / purchases). */
    public static function isOperatingExpenseAccount(int|string $accountType): bool
    {
        $type = (int) $accountType;
        if (in_array($type, [11, 12], true)) {
            return true;
        }

        $meta = self::forAccountType($accountType);
        if ($meta) {
            $classId = trim((string) ($meta['class_id'] ?? ''));
            if (in_array($classId, ['4', '5'], true)) {
                $typeName = strtoupper(html_entity_decode((string) ($meta['name'] ?? ''), ENT_QUOTES | ENT_HTML5));

                return (bool) preg_match('/(PAYROLL|GENERAL|ADMINISTRATIVE|G&A)/', $typeName);
            }
        }

        return false;
    }

    /**
     * Map expense accounts to P&L operating expense categories.
     *
     * @return 'sales_distribution'|'general_administrative'|'finance'|'other_cost'
     */
    public static function profitAndLossExpenseCategory(int|string $accountType, string $accountName = ''): string
    {
        $type = (int) $accountType;
        if ($type === 12) {
            return 'general_administrative';
        }

        $name = strtoupper($accountName);
        if (preg_match('/\b(INTEREST|FINANCE|BANK CHARG|LOAN|FOREX)\b/', $name)) {
            return 'finance';
        }
        if (preg_match('/\b(MARKETING|DISTRIBUTION|SHIPPING|ADVERT|SALES &|SALES AND|BATA|DISCOUNT)\b/', $name)) {
            return 'sales_distribution';
        }
        if ($type === 11 || preg_match('/\b(SALARY|PAYROLL|WAGE|ADMIN|OFFICE|RENT|UTILITY)\b/', $name)) {
            return $type === 12 ? 'general_administrative' : 'other_cost';
        }

        return 'other_cost';
    }

    /** Sales discounts given — P&L distribution / selling expense. */
    public static function isDiscountGivenAccount(string $accountName): bool
    {
        $name = strtoupper(html_entity_decode($accountName, ENT_QUOTES | ENT_HTML5));

        return (bool) preg_match('/\b(DISCOUNTS?\s*GIVEN|SALES\s*DISCOUNTS?)\b/', $name);
    }

    /** Purchase / supplier discounts received — P&L other income. */
    public static function isDiscountAllowedIncomeAccount(string $accountName): bool
    {
        $name = strtoupper(html_entity_decode($accountName, ENT_QUOTES | ENT_HTML5));

        return (bool) preg_match('/\b(DISCOUNTS?\s*(RECEIVED|ALLOWED)|PURCHASE\s*DISCOUNTS?)\b/', $name);
    }
}
