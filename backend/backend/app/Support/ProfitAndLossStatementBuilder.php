<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Structured P&L (chart class + group) with standard formulas:
 * COGS = Opening Stock + Purchases − Closing Stock
 * Gross Profit = Sales − COGS
 * Total Income = Gross Profit + Other Income
 * Net Profit = Total Income − Operating Expenses
 */
class ProfitAndLossStatementBuilder
{
    private const INVENTORY_ACCOUNT_TYPE = 2;

    private const EXPENSE_CATEGORIES = [
        'sales_distribution' => 'Sales & Distribution Cost',
        'general_administrative' => 'General & Administrative Cost',
        'finance' => 'Finance Cost',
        'other_cost' => 'Other Cost',
    ];

    /**
     * @param  Collection<int, object|array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    public function build(
        Collection $rows,
        string $fromDate,
        string $toDate,
        string $compareTo = 'Accumulated',
        ?string $costCenter = null
    ): array {
        $normalized = $rows
            ->map(fn ($row) => $this->normalizeRow($row))
            ->filter()
            ->values();

        $discountGivenRows = $normalized
            ->filter(fn ($r) => ChartAccountMetadata::isDiscountGivenAccount((string) ($r['groupAccountName'] ?? '')))
            ->map(fn ($r) => $this->asExpenseRow($r, 'sales_distribution'))
            ->values();

        $discountAllowedRows = $normalized
            ->filter(fn ($r) => ChartAccountMetadata::isDiscountAllowedIncomeAccount((string) ($r['groupAccountName'] ?? '')))
            ->map(fn ($r) => $this->asOtherIncomeRow($r))
            ->values();

        $plRows = $normalized->reject(fn ($r) => ChartAccountMetadata::isDiscountGivenAccount((string) ($r['groupAccountName'] ?? ''))
            || ChartAccountMetadata::isDiscountAllowedIncomeAccount((string) ($r['groupAccountName'] ?? '')));

        $incomeRows = $plRows->filter(fn ($r) => ChartAccountMetadata::isIncomeClassRow($r));
        $costRows = $plRows->filter(fn ($r) => ChartAccountMetadata::isCostClassRow($r));

        $salesRows = $incomeRows->filter(fn ($r) => ChartAccountMetadata::isSalesRevenueGroup((string) ($r['typeName'] ?? '')));
        $otherIncomeRows = $incomeRows
            ->reject(fn ($r) => ChartAccountMetadata::isSalesRevenueGroup((string) ($r['typeName'] ?? '')))
            ->concat($discountAllowedRows);
        $cogsRows = $costRows->filter(fn ($r) => ChartAccountMetadata::isCogsChartGroup((string) ($r['typeName'] ?? '')));
        $operatingExpenseRows = $costRows
            ->reject(fn ($r) => ChartAccountMetadata::isCogsChartGroup((string) ($r['typeName'] ?? '')))
            ->concat($discountGivenRows);

        $openingStock = $this->inventoryStockBalances($fromDate, $toDate, $compareTo, $costCenter, 'opening');
        $closingStock = $this->inventoryStockBalances($fromDate, $toDate, $compareTo, $costCenter, 'closing');

        $totalSales = $this->sumAmounts($salesRows);
        $totalPurchases = $this->sumAmounts($cogsRows);
        $costOfSales = [
            'period' => round($openingStock['period'] + $totalPurchases['period'] - $closingStock['period'], 2),
            'compare' => round($openingStock['compare'] + $totalPurchases['compare'] - $closingStock['compare'], 2),
        ];
        $grossProfit = [
            'period' => round($totalSales['period'] - $costOfSales['period'], 2),
            'compare' => round($totalSales['compare'] - $costOfSales['compare'], 2),
        ];
        $totalOtherIncome = $this->sumAmounts($otherIncomeRows);
        $totalIncome = [
            'period' => round($grossProfit['period'] + $totalOtherIncome['period'], 2),
            'compare' => round($grossProfit['compare'] + $totalOtherIncome['compare'], 2),
        ];

        $expenseGroups = $this->groupOperatingExpenses($operatingExpenseRows);
        $totalOperatingExpenses = $this->sumAmounts($operatingExpenseRows);
        $netProfit = [
            'period' => round($totalIncome['period'] - $totalOperatingExpenses['period'], 2),
            'compare' => round($totalIncome['compare'] - $totalOperatingExpenses['compare'], 2),
        ];

        return [
            'sections' => [
                $this->groupedAccountSection('sales', 'Sales Revenue', $salesRows, 'Total Sales'),
                $this->costOfSalesSection($cogsRows, $openingStock, $closingStock, $costOfSales),
                $this->summarySection('gross_profit', 'Gross Profit', $grossProfit),
                $this->groupedAccountSection('other_income', 'Other Income', $otherIncomeRows, 'Total Other Income'),
                $this->summarySection('total_income', 'Total Income', $totalIncome),
                $this->operatingExpenseSection($expenseGroups, $totalOperatingExpenses),
            ],
            'summary' => [
                'sales' => $this->withAchieve($totalSales),
                'openingStock' => $this->withAchieve($openingStock),
                'purchases' => $this->withAchieve($totalPurchases),
                'closingStock' => $this->withAchieve($closingStock),
                'costOfSales' => $this->withAchieve($costOfSales),
                'grossProfit' => $this->withAchieve($grossProfit),
                'otherIncome' => $this->withAchieve($totalOtherIncome),
                'totalIncome' => $this->withAchieve($totalIncome),
                'expenseCategories' => [
                    'sales_distribution' => $this->withAchieve($expenseGroups['sales_distribution']['totals']),
                    'general_administrative' => $this->withAchieve($expenseGroups['general_administrative']['totals']),
                    'finance' => $this->withAchieve($expenseGroups['finance']['totals']),
                    'other_cost' => $this->withAchieve($expenseGroups['other_cost']['totals']),
                ],
                'totalExpenses' => $this->withAchieve($totalOperatingExpenses),
                'netProfit' => $this->withAchieve($netProfit),
                'calculatedReturn' => $this->withAchieve($netProfit),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>|null
     */
    private function normalizeRow(object|array $row): ?array
    {
        $r = (array) $row;
        $type = (int) ($r['account_type'] ?? 0);
        if (! ChartAccountMetadata::isProfitAndLossAccount($type)) {
            return null;
        }

        $period = round((float) ($r['period'] ?? 0), 2);
        $compare = round((float) ($r['compareValue'] ?? 0), 2);
        if (abs($period) + abs($compare) < 0.001) {
            return null;
        }

        return [
            'account_code' => trim((string) ($r['account_code'] ?? '')),
            'groupAccountName' => (string) ($r['groupAccountName'] ?? $r['account_name'] ?? ''),
            'account_type' => $type,
            'typeName' => (string) ($r['typeName'] ?? $r['type'] ?? 'General'),
            'classId' => trim((string) ($r['classId'] ?? '')),
            'className' => (string) ($r['className'] ?? ''),
            'period' => $period,
            'compareValue' => $compare,
            'achievePercent' => (string) ($r['achievePercent'] ?? $this->achievePercent($period, $compare)),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function asExpenseRow(array $row, string $category): array
    {
        return array_merge($row, [
            'classId' => '4',
            'account_type' => 12,
            'period' => round(abs((float) ($row['period'] ?? 0)), 2),
            'compareValue' => round(abs((float) ($row['compareValue'] ?? 0)), 2),
            'pl_expense_category' => $category,
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function asOtherIncomeRow(array $row): array
    {
        return array_merge($row, [
            'classId' => '3',
            'account_type' => 9,
            'period' => round(abs((float) ($row['period'] ?? 0)), 2),
            'compareValue' => round(abs((float) ($row['compareValue'] ?? 0)), 2),
        ]);
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array{period: float, compare: float}
     */
    private function sumAmounts(Collection $rows): array
    {
        return [
            'period' => round($rows->sum('period'), 2),
            'compare' => round($rows->sum('compareValue'), 2),
        ];
    }

    /**
     * @param  array{period: float, compare: float}  $amounts
     * @return array{period: float, compare: float, achievePercent: string}
     */
    private function withAchieve(array $amounts): array
    {
        return [
            'period' => $amounts['period'],
            'compare' => $amounts['compare'],
            'achievePercent' => $this->achievePercent($amounts['period'], $amounts['compare']),
        ];
    }

    private function achievePercent(float $period, float $compare): string
    {
        if (abs($compare) < 0.001) {
            return '999.0';
        }

        return number_format(($period / $compare) * 100, 1, '.', '');
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array<string, mixed>
     */
    private function groupedAccountSection(
        string $key,
        string $title,
        Collection $rows,
        string $sectionTotalLabel
    ): array {
        $lines = [];
        foreach ($this->groupByChartType($rows) as $groupName => $groupRows) {
            $lines[] = ['kind' => 'group', 'label' => strtoupper($groupName)];
            foreach ($groupRows as $row) {
                $lines[] = $this->accountLine($row);
            }
            $lines[] = $this->summaryLine('Total '.strtoupper($groupName), $this->sumAmounts(collect($groupRows)));
        }

        return [
            'key' => $key,
            'title' => $title,
            'lines' => $lines,
            'subtotals' => [
                $this->summaryLine($sectionTotalLabel, $this->sumAmounts($rows), true),
            ],
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $cogsRows
     * @param  array{period: float, compare: float}  $costOfSales
     * @return array<string, mixed>
     */
    private function costOfSalesSection(
        Collection $cogsRows,
        array $openingStock,
        array $closingStock,
        array $costOfSales
    ): array {
        $lines = [
            $this->calculatedLine('Opening Stock', $openingStock['period'], $openingStock['compare']),
        ];

        foreach ($this->groupByChartType($cogsRows) as $groupName => $groupRows) {
            $lines[] = ['kind' => 'group', 'label' => strtoupper($groupName)];
            foreach ($groupRows as $row) {
                $lines[] = $this->accountLine($row);
            }
        }

        $lines[] = $this->calculatedLine(
            'Closing Stock',
            -$closingStock['period'],
            -$closingStock['compare']
        );

        return [
            'key' => 'cost_of_sales',
            'title' => 'Cost of Sales',
            'lines' => $lines,
            'subtotals' => [
                $this->summaryLine('Cost of Sales', $costOfSales, true),
            ],
        ];
    }

    /**
     * @param  array{period: float, compare: float}  $amounts
     * @return array<string, mixed>
     */
    private function summarySection(string $key, string $title, array $amounts): array
    {
        return [
            'key' => $key,
            'title' => $title,
            'lines' => [],
            'subtotals' => [
                $this->summaryLine($title, $amounts, true),
            ],
        ];
    }

    /**
     * @param  array<string, array{title: string, rows: Collection<int, array<string, mixed>>, totals: array{period: float, compare: float}}>  $groups
     * @param  array{period: float, compare: float}  $totalExpenses
     * @return array<string, mixed>
     */
    private function operatingExpenseSection(array $groups, array $totalExpenses): array
    {
        $lines = [];
        foreach (self::EXPENSE_CATEGORIES as $categoryKey => $categoryTitle) {
            $group = $groups[$categoryKey] ?? null;
            if (! $group || $group['rows']->isEmpty()) {
                continue;
            }

            $lines[] = ['kind' => 'group', 'label' => $categoryTitle];
            foreach ($group['rows'] as $row) {
                $lines[] = $this->accountLine($row);
            }
            $lines[] = $this->summaryLine('Total '.$categoryTitle, $group['totals']);
        }

        return [
            'key' => 'operating_expenses',
            'title' => 'Operating Expenses',
            'lines' => $lines,
            'subtotals' => [
                $this->summaryLine('Total Expenses', $totalExpenses, true),
            ],
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $expenseRows
     * @return array<string, array{title: string, rows: Collection<int, array<string, mixed>>, totals: array{period: float, compare: float}}>
     */
    private function groupOperatingExpenses(Collection $expenseRows): array
    {
        $groups = [];
        foreach (self::EXPENSE_CATEGORIES as $key => $title) {
            $groups[$key] = [
                'title' => $title,
                'rows' => collect(),
                'totals' => ['period' => 0.0, 'compare' => 0.0],
            ];
        }

        foreach ($expenseRows as $row) {
            $category = (string) ($row['pl_expense_category'] ?? ChartAccountMetadata::profitAndLossExpenseCategory(
                $row['account_type'],
                $row['groupAccountName']
            ));
            $groups[$category]['rows']->push($row);
        }

        foreach ($groups as $key => $group) {
            $groups[$key]['totals'] = $this->sumAmounts($group['rows']);
        }

        return $groups;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array<string, list<array<string, mixed>>>
     */
    private function groupByChartType(Collection $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $group = trim((string) ($row['typeName'] ?? 'General'));
            if ($group === '') {
                $group = 'General';
            }
            $grouped[$group][] = $row;
        }

        uksort($grouped, function ($a, $b) {
            $order = ['Sales Revenue', 'Other Revenue', 'Cost of Goods Sold', 'Payroll Expenses'];
            $ia = array_search($a, $order, true);
            $ib = array_search($b, $order, true);
            if ($ia !== false && $ib !== false) {
                return $ia <=> $ib;
            }
            if ($ia !== false) {
                return -1;
            }
            if ($ib !== false) {
                return 1;
            }

            return strcasecmp($a, $b);
        });

        return $grouped;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
  private function accountLine(array $row): array
  {
    return [
      'kind' => 'account',
      'account_code' => $row['account_code'],
      'label' => $row['groupAccountName'],
      'account_type' => $row['account_type'],
      'classId' => $row['classId'],
      'typeName' => $row['typeName'],
      'period' => $row['period'],
      'compareValue' => $row['compareValue'],
      'achievePercent' => $row['achievePercent'],
    ];
  }

    private function calculatedLine(string $label, float $period, float $compare): array
    {
        return [
            'kind' => 'calculated',
            'label' => $label,
            'period' => round($period, 2),
            'compareValue' => round($compare, 2),
            'achievePercent' => $this->achievePercent($period, $compare),
        ];
    }

    /**
     * @param  array{period: float, compare: float}  $amounts
     * @return array<string, mixed>
     */
    private function summaryLine(string $label, array $amounts, bool $bold = false): array
    {
        return [
            'kind' => 'subtotal',
            'label' => $label,
            'period' => $amounts['period'],
            'compareValue' => $amounts['compare'],
            'achievePercent' => $this->achievePercent($amounts['period'], $amounts['compare']),
            'bold' => $bold,
        ];
    }

    /**
     * @return array{period: float, compare: float}
     */
    private function inventoryStockBalances(
        string $fromDate,
        string $toDate,
        string $compareTo,
        ?string $costCenter,
        string $which
    ): array {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasTable('chart_master')) {
            return ['period' => 0.0, 'compare' => 0.0];
        }

        $periodAsAt = $which === 'opening'
            ? Carbon::parse($fromDate)->subDay()->toDateString()
            : $toDate;

        $compareAsAt = $this->compareStockAsAt($fromDate, $toDate, $compareTo, $which);

        return [
            'period' => $this->inventoryStockAt($periodAsAt, $costCenter),
            'compare' => $this->inventoryStockAt($compareAsAt, $costCenter),
        ];
    }

    private function compareStockAsAt(string $fromDate, string $toDate, string $compareTo, string $which): string
    {
        if ($compareTo === 'Period Y-1') {
            $ref = $which === 'opening' ? $fromDate : $toDate;

            return Carbon::parse($ref)->subYear()->subDay()->toDateString();
        }

        $fyStart = ActiveFiscalYear::containingDate($fromDate)['fiscal_year_from'];
        if ($fromDate <= $fyStart) {
            return Carbon::parse($fromDate)->subDay()->toDateString();
        }

        return $which === 'opening'
            ? Carbon::parse($fyStart)->subDay()->toDateString()
            : Carbon::parse($fromDate)->subDay()->toDateString();
    }

    private function inventoryStockAt(string $asAtDate, ?string $costCenter): float
    {
        $debitExpr = GlBalanceQuery::throughDateDebitSumExpr('gt', $asAtDate);
        $creditExpr = GlBalanceQuery::throughDateCreditSumExpr('gt', $asAtDate);

        $query = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            })
            ->where('cm.account_type', (string) self::INVENTORY_ACCOUNT_TYPE);
        GlBalanceQuery::applyCostCenter($query, $costCenter);

        $rows = $query
            ->groupBy('cm.account_code', 'cm.account_type')
            ->selectRaw("cm.account_type, {$debitExpr} as debit_total, {$creditExpr} as credit_total")
            ->get();

        $total = 0.0;
        foreach ($rows as $row) {
            $total += TrialAccountBalance::signedBalance(
                (float) $row->debit_total,
                (float) $row->credit_total,
                (int) $row->account_type
            );
        }

        return round(max($total, 0), 2);
    }
}
