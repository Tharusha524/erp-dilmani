<?php

namespace App\Services\Sales;

use App\Services\Accounting\AllocationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesInquiryService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function salesQuotations(array $filters = []): array
    {
        return $this->salesOrdersQuery(array_merge($filters, ['trans_type' => 32]));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function salesOrders(array $filters = []): array
    {
        return $this->salesOrdersQuery(array_merge($filters, ['trans_type' => 30]));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function customerTransactions(array $filters = []): array
    {
        if (! Schema::hasTable('debtor_trans')) {
            return [];
        }

        $q = DB::table('debtor_trans as t')
            ->leftJoin('debtors_master as d', 't.debtor_no', '=', 'd.debtor_no')
            ->select('t.*', 'd.name as customer_name');

        if (! empty($filters['debtor_no'])) {
            $q->where('t.debtor_no', (int) $filters['debtor_no']);
        }
        if (! empty($filters['trans_type'])) {
            $q->where('t.trans_type', (int) $filters['trans_type']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('t.tran_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('t.tran_date', '<=', $filters['to_date']);
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        return $q->orderByDesc('t.tran_date')->orderByDesc('t.trans_no')->limit($limit)
            ->get()->map(fn ($row) => (array) $row)->all();
    }

    /**
     * FrontAccounting allocation inquiry — excludes deliveries (13).
     *
     * @param  array<string, mixed>  $filters
     */
    public function customerAllocations(array $filters = []): array
    {
        if (! Schema::hasTable('debtor_trans')) {
            return [];
        }

        $q = DB::table('debtor_trans as t')
            ->leftJoin('debtors_master as d', 't.debtor_no', '=', 'd.debtor_no')
            ->where('t.trans_type', '!=', 13)
            ->whereIn('t.trans_type', [10, 11, 12])
            ->select('t.*', 'd.name as customer_name', 'd.curr_code');

        if (! empty($filters['debtor_no'])) {
            $q->where('t.debtor_no', (int) $filters['debtor_no']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('t.tran_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('t.tran_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['trans_type'])) {
            $q->where('t.trans_type', (int) $filters['trans_type']);
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        $rows = $q->orderBy('t.tran_date')->orderBy('t.trans_no')->orderByDesc('t.id')->limit($limit)
            ->get()
            ->unique(fn ($row) => "{$row->debtor_no}-{$row->trans_type}-{$row->trans_no}")
            ->map(function ($row) {
                $total = (float) $row->ov_amount + (float) ($row->ov_gst ?? 0)
                    + (float) ($row->ov_freight ?? 0) + (float) ($row->ov_freight_tax ?? 0)
                    + (float) ($row->ov_discount ?? 0);
                $sign = in_array((int) $row->trans_type, [11, 12], true) ? -1 : 1;
                $balance = round($sign * ($total - (float) ($row->alloc ?? 0)), 2);
                $left = round(max(0, abs($balance)), 2);

                return [
                    ...(array) $row,
                    'document_total' => round($sign * $total, 2),
                    'balance' => $balance,
                    'left_to_allocate' => $left,
                    'settled' => $left < 0.01,
                ];
            })->values();

        $settledFilter = (string) ($filters['settled'] ?? '');
        if ($settledFilter === 'no') {
            $rows = $rows->filter(fn (array $row) => ! $row['settled'])->values();
        } elseif ($settledFilter === 'yes') {
            $rows = $rows->filter(fn (array $row) => $row['settled'])->values();
        }

        return $rows->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function salesOrdersQuery(array $filters): array
    {
        if (! Schema::hasTable('sales_orders')) {
            return [];
        }

        $transType = (int) ($filters['trans_type'] ?? 30);
        $q = DB::table('sales_orders as so')
            ->leftJoin('debtors_master as d', 'so.debtor_no', '=', 'd.debtor_no')
            ->leftJoin('cust_branch as b', 'so.branch_code', '=', 'b.branch_code')
            ->where('so.trans_type', $transType)
            ->select('so.*', 'd.name as customer_name', 'b.br_name as branch_name');

        if (! empty($filters['debtor_no'])) {
            $q->where('so.debtor_no', (int) $filters['debtor_no']);
        }
        if (! empty($filters['from_stk_loc'])) {
            $q->where('so.from_stk_loc', $filters['from_stk_loc']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('so.ord_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('so.ord_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['reference'])) {
            $q->where('so.reference', 'like', '%'.$filters['reference'].'%');
        }
        if (! empty($filters['order_no'])) {
            $q->where('so.order_no', (int) $filters['order_no']);
        }
        if (($filters['outstanding'] ?? false) && Schema::hasTable('sales_order_details')) {
            $q->whereExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('sales_order_details as sod')
                    ->whereColumn('sod.order_no', 'so.order_no')
                    ->whereRaw('sod.qty_sent < sod.quantity');
            });
        }
        if (($filters['template'] ?? false)) {
            $q->where('so.type', 1);
        }
        if (($filters['prepaid'] ?? false)) {
            $q->where('so.prep_amount', '>', 0);
        }
        if (! empty($filters['stk_code']) && Schema::hasTable('sales_order_details')) {
            $q->whereExists(function ($sub) use ($filters) {
                $sub->select(DB::raw(1))
                    ->from('sales_order_details as sod')
                    ->whereColumn('sod.order_no', 'so.order_no')
                    ->where('sod.stk_code', 'like', '%'.$filters['stk_code'].'%');
            });
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        return $q->orderByDesc('so.ord_date')->orderByDesc('so.order_no')->limit($limit)
            ->get()->map(fn ($row) => (array) $row)->all();
    }
}
