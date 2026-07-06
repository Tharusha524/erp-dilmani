<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CostCenterGlBalance
{
    public static function sum(int $costCenterId, ?string $fromDate = null, ?string $toDate = null): float
    {
        if (! Schema::hasTable('gl_trans')) {
            return 0.0;
        }

        $query = DB::table('gl_trans');
        self::applyCostCenterFilter($query, $costCenterId);
        self::applyDateFilter($query, $fromDate, $toDate);

        if (Schema::hasColumn('gl_trans', 'amount')) {
            return round((float) $query->sum('amount'), 2);
        }

        if (Schema::hasColumn('gl_trans', 'debit') || Schema::hasColumn('gl_trans', 'credit')) {
            $row = $query->selectRaw(
                'SUM(COALESCE(debit, 0) - COALESCE(credit, 0)) as total'
            )->first();

            return round((float) ($row->total ?? 0), 2);
        }

        return 0.0;
    }

    /**
     * @return Collection<int, object{account: string, account_name: string, amount: float}>
     */
    public static function byAccount(int $costCenterId, ?string $fromDate = null, ?string $toDate = null): Collection
    {
        if (! Schema::hasTable('gl_trans')) {
            return collect();
        }

        $amountExpr = Schema::hasColumn('gl_trans', 'amount')
            ? 'SUM(gl_trans.amount)'
            : 'SUM(COALESCE(gl_trans.debit, 0) - COALESCE(gl_trans.credit, 0))';

        $query = DB::table('gl_trans');

        if (Schema::hasTable('chart_master') && Schema::hasColumn('chart_master', 'account_code')) {
            $query->leftJoin('chart_master as cm', 'gl_trans.account', '=', 'cm.account_code')
                ->select(
                    'gl_trans.account',
                    DB::raw('COALESCE(cm.account_name, gl_trans.account) as account_name'),
                    DB::raw("{$amountExpr} as amount")
                )
                ->groupBy('gl_trans.account', 'cm.account_name');
        } else {
            $query->select(
                'gl_trans.account',
                DB::raw('gl_trans.account as account_name'),
                DB::raw("{$amountExpr} as amount")
            )
                ->groupBy('gl_trans.account');
        }

        self::applyCostCenterFilter($query, $costCenterId);
        self::applyDateFilter($query, $fromDate, $toDate);

        return $query->orderBy('gl_trans.account')
            ->get()
            ->map(function ($row) {
                $row->amount = round((float) $row->amount, 2);

                return $row;
            })
            ->filter(fn ($row) => abs((float) $row->amount) > 0.0001)
            ->values();
    }

    public static function hasTransactions(int $costCenterId): bool
    {
        if (! Schema::hasTable('gl_trans')) {
            return false;
        }

        $query = DB::table('gl_trans');
        self::applyCostCenterFilter($query, $costCenterId);

        return $query->exists();
    }

    private static function applyCostCenterFilter(Builder $query, int $costCenterId): void
    {
        $query->where(function (Builder $q) use ($costCenterId) {
            $applied = false;

            if (Schema::hasColumn('gl_trans', 'cost_center_id')) {
                $q->where('gl_trans.cost_center_id', $costCenterId);
                $applied = true;
            }

            if (Schema::hasColumn('gl_trans', 'cost_center2_id')) {
                if ($applied) {
                    $q->orWhere('gl_trans.cost_center2_id', $costCenterId);
                } else {
                    $q->where('gl_trans.cost_center2_id', $costCenterId);
                }
            }
        });
    }

    private static function applyDateFilter(Builder $query, ?string $fromDate, ?string $toDate): void
    {
        $dateCol = self::dateColumn();
        if (! $dateCol) {
            return;
        }

        if ($fromDate) {
            $query->whereDate("gl_trans.{$dateCol}", '>=', $fromDate);
        }

        if ($toDate) {
            $query->whereDate("gl_trans.{$dateCol}", '<=', $toDate);
        }
    }

    private static function dateColumn(): ?string
    {
        if (Schema::hasColumn('gl_trans', 'tran_date')) {
            return 'tran_date';
        }

        if (Schema::hasColumn('gl_trans', 'date')) {
            return 'date';
        }

        return null;
    }
}
