<?php

namespace App\Repositories\All\BalanceSheet;

use App\Models\ChartMaster;
use App\Repositories\Base\BaseRepository;
use App\Support\BalanceSheetCalculatedReturn;
use App\Support\ChartAccountMetadata;
use App\Support\GlBalanceQuery;
use App\Support\TrialAccountBalance;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BalanceSheetRepository extends BaseRepository implements BalanceSheetInterface
{
    public function __construct(ChartMaster $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): array
    {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasColumn('gl_trans', 'account')) {
            return $this->emptyResult();
        }

        $fromDate = (string) ($filters['fromDate'] ?? '');
        $toDate = (string) ($filters['toDate'] ?? '');
        $asAtDate = (string) ($filters['asAtDate'] ?? '');

        if ($fromDate === '' && $asAtDate !== '') {
            $fromDate = $asAtDate;
            $toDate = $asAtDate;
        }

        $noZeroValues = array_key_exists('noZeroValues', $filters)
            ? filter_var($filters['noZeroValues'], FILTER_VALIDATE_BOOLEAN)
            : true;
        $dimension = $filters['dimension'] ?? null;

        $from = $fromDate !== '' ? $fromDate : null;
        $to = $toDate !== '' ? $toDate : null;
        $openingDebitExpr = GlBalanceQuery::openingDebitSumExpr('gt', $from);
        $openingCreditExpr = GlBalanceQuery::openingCreditSumExpr('gt', $from);
        $periodDebitExpr = GlBalanceQuery::periodDebitSumExpr('gt', $from, $to);
        $periodCreditExpr = GlBalanceQuery::periodCreditSumExpr('gt', $from, $to);

        // Single GL pass: opening (<= From, incl. opening JE) and period (> From..To) are mutually exclusive.
        $glSub = DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            });
        GlBalanceQuery::applyDimension($glSub, $dimension);
        $glSub = $glSub
            ->groupBy('cm.account_code')
            ->selectRaw(
                "cm.account_code,
                {$openingDebitExpr} as opening_debit,
                {$openingCreditExpr} as opening_credit,
                {$periodDebitExpr} as period_debit,
                {$periodCreditExpr} as period_credit"
            );

        $query = DB::table('chart_master as cm')
            ->leftJoinSub($glSub, 'gl', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gl.account_code)'));
            });

        $hasChartTypes = Schema::hasTable('chart_types');
        if ($hasChartTypes) {
            $query->leftJoin('chart_types as ct', 'cm.account_type', '=', 'ct.id');
        }
        if ($hasChartTypes && Schema::hasTable('chart_class')) {
            $query->leftJoin('chart_class as cc', 'ct.class_id', '=', 'cc.cid');
        }

        $rawRows = $query
            ->select(
                'cm.account_code as code',
                'cm.account_name as description',
                'cm.account_type as account_type',
                $hasChartTypes ? 'ct.name as type' : DB::raw("'' as type"),
                $hasChartTypes ? 'ct.class_id as class_id' : DB::raw("'' as class_id"),
                ($hasChartTypes && Schema::hasTable('chart_class')) ? 'cc.class_name as class' : DB::raw("'' as class"),
                DB::raw('COALESCE(gl.opening_debit, 0) as opening_debit'),
                DB::raw('COALESCE(gl.opening_credit, 0) as opening_credit'),
                DB::raw('COALESCE(gl.period_debit, 0) as period_debit'),
                DB::raw('COALESCE(gl.period_credit, 0) as period_credit')
            )
            ->orderBy('class_id')
            ->orderBy('account_type')
            ->orderBy('cm.account_code')
            ->get();

        $rows = $this->mapRows($rawRows, $noZeroValues);
        $calculatedReturn = BalanceSheetCalculatedReturn::amounts(
            (string) ($from ?? ''),
            (string) ($to ?? ''),
            $dimension
        );
        $rows = $this->appendCalculatedReturnRow($rows, $calculatedReturn, $noZeroValues);

        return [
            'rows' => $rows->values()->all(),
            'totals' => $this->buildTotals($rows),
            'calculated_return' => $calculatedReturn,
        ];
    }

    private function mapRows(Collection $rawRows, bool $noZeroValues): Collection
    {
        return $rawRows->map(function ($row) {
            $type = (int) $row->account_type;

            if (! TrialAccountBalance::isBalanceSheetAccount($type)) {
                return null;
            }

            $openingDebit = (float) $row->opening_debit;
            $openingCredit = (float) $row->opening_credit;
            $periodDebit = (float) $row->period_debit;
            $periodCredit = (float) $row->period_credit;

            $glOpening = $openingDebit - $openingCredit;
            $glPeriod = $periodDebit - $periodCredit;

            $opening = TrialAccountBalance::balanceSheetAmount($glOpening, $type);
            $period = TrialAccountBalance::balanceSheetAmount($glPeriod, $type);
            // Closing = opening + period (never double-count opening in period column).
            $closing = round($opening + $period, 2);
            $classId = trim((string) ($row->class_id ?? ''));
            $className = (string) ($row->class ?? '');
            $typeName = (string) ($row->type ?? '');
            $section = $this->resolveTotalsSection($classId, $type);

            return (object) [
                'code' => trim((string) $row->code),
                'description' => (string) $row->description,
                'account_type' => $type,
                'type' => $typeName,
                'typeName' => $typeName,
                'class' => $className,
                'className' => $className,
                'class_id' => $classId,
                'classId' => $classId,
                'section' => $section,
                'opening' => round($opening, 2),
                'period' => round($period, 2),
                'closing' => round($closing, 2),
                'amount' => round($closing, 2),
            ];
        })->filter(function ($row) use ($noZeroValues) {
            if ($row === null) {
                return false;
            }

            if (! $noZeroValues) {
                return true;
            }

            return abs($row->opening) + abs($row->period) + abs($row->closing) > 0.001;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTotals(Collection $rows): array
    {
        $opening = $this->emptyTotalsSlice();
        $period = $this->emptyTotalsSlice();
        $closing = $this->emptyTotalsSlice();

        foreach ($rows as $row) {
            $section = $row->section ?? TrialAccountBalance::balanceSheetSection((int) $row->account_type);
            if (! $section) {
                continue;
            }

            $opening[$section] += (float) $row->opening;
            $period[$section] += (float) $row->period;
            $closing[$section] += (float) $row->closing;
        }

        return [
            'opening' => $this->finalizeTotalsSlice($opening),
            'period' => $this->finalizeTotalsSlice($period),
            'closing' => $this->finalizeTotalsSlice($closing),
        ];
    }

    /**
     * @return array<string, float>
     */
    private function emptyTotalsSlice(): array
    {
        return [
            'capital_assets' => 0.0,
            'current_assets' => 0.0,
            'total_assets' => 0.0,
            'long_term_liabilities' => 0.0,
            'current_liabilities' => 0.0,
            'total_liabilities' => 0.0,
            'share_capital' => 0.0,
            'retained_earnings' => 0.0,
            'total_equity' => 0.0,
            'liabilities_plus_equity' => 0.0,
        ];
    }

    /**
     * @param  array<string, float>  $slice
     * @return array<string, float|bool>
     */
    private function finalizeTotalsSlice(array $slice): array
    {
        $slice['total_assets'] = round(
            $slice['capital_assets'] + $slice['current_assets'],
            2
        );
        $slice['total_liabilities'] = round(
            $slice['long_term_liabilities'] + $slice['current_liabilities'],
            2
        );
        $slice['total_equity'] = round(
            $slice['share_capital'] + $slice['retained_earnings'],
            2
        );
        $slice['liabilities_plus_equity'] = round(
            $slice['total_liabilities'] + $slice['total_equity'],
            2
        );

        foreach ($slice as $key => $value) {
            if ($key === 'equation_balanced') {
                continue;
            }
            $slice[$key] = round((float) $value, 2);
        }

        $slice['equation_balanced'] = abs(
            $slice['total_assets'] - $slice['liabilities_plus_equity']
        ) < 0.01;

        return $slice;
    }

    private function resolveTotalsSection(string $classId, int $accountType): ?string
    {
        if ($classId === '1') {
            return $accountType === 3 ? 'capital_assets' : 'current_assets';
        }

        if ($classId === '2') {
            $section = TrialAccountBalance::balanceSheetSection($accountType);
            if (in_array($section, [
                'long_term_liabilities',
                'current_liabilities',
                'share_capital',
                'retained_earnings',
            ], true)) {
                return $section;
            }

            return 'current_liabilities';
        }

        return TrialAccountBalance::balanceSheetSection($accountType);
    }

    /**
     * @param  array{opening: float, period: float, closing: float}  $calculatedReturn
     */
    private function appendCalculatedReturnRow(
        Collection $rows,
        array $calculatedReturn,
        bool $noZeroValues
    ): Collection {
        $opening = (float) ($calculatedReturn['opening'] ?? 0);
        $period = (float) ($calculatedReturn['period'] ?? 0);
        $closing = (float) ($calculatedReturn['closing'] ?? 0);

        if ($noZeroValues && abs($opening) + abs($period) + abs($closing) < 0.001) {
            return $rows;
        }

        $reAccountType = BalanceSheetCalculatedReturn::retainedEarningsAccountType();
        $typeMeta = ChartAccountMetadata::forAccountType($reAccountType);
        $typeName = BalanceSheetCalculatedReturn::retainedEarningsGroupName();
        $className = (string) ($typeMeta['class_name'] ?? 'Liabilities and Equity');

        $accountCode = BalanceSheetCalculatedReturn::accountCode();
        $newRow = (object) [
            'code' => $accountCode,
            'description' => BalanceSheetCalculatedReturn::DESCRIPTION,
            'account_type' => $reAccountType,
            'type' => $typeName,
            'typeName' => $typeName,
            'class' => $className,
            'className' => $className,
            'class_id' => '2',
            'classId' => '2',
            'section' => 'retained_earnings',
            'opening' => round($opening, 2),
            'period' => round($period, 2),
            'closing' => round($closing, 2),
            'amount' => round($closing, 2),
            'is_calculated_return' => true,
        ];

        $lastReIndex = $rows
            ->keys()
            ->filter(fn ($index) => ($rows[$index]->section ?? '') === 'retained_earnings')
            ->last();

        if ($lastReIndex !== null) {
            $position = (int) $lastReIndex + 1;

            return $rows->slice(0, $position)
                ->push($newRow)
                ->concat($rows->slice($position));
        }

        return $rows->push($newRow);
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyResult(): array
    {
        $empty = $this->finalizeTotalsSlice($this->emptyTotalsSlice());
        $zeroReturn = ['opening' => 0.0, 'period' => 0.0, 'closing' => 0.0];

        return [
            'rows' => [],
            'totals' => [
                'opening' => $empty,
                'period' => $empty,
                'closing' => $empty,
            ],
            'calculated_return' => $zeroReturn,
        ];
    }
}
