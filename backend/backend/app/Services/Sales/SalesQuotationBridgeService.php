<?php

namespace App\Services\Sales;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unifies legacy quotations API with FrontAccounting sales_orders (trans_type 32).
 */
class SalesQuotationBridgeService
{
    public function __construct(private SalesOrderPostingService $posting) {}

    /**
     * @param  array<string, mixed>  $header
     * @param  list<array<string, mixed>>  $lines
     */
    public function create(array $header, array $lines): array
    {
        $header['trans_type'] = 32;
        $mappedLines = array_map(fn (array $line) => [
            'stk_code' => (string) ($line['stock_id'] ?? $line['stk_code'] ?? ''),
            'description' => $line['description'] ?? '',
            'quantity' => (float) ($line['quantity'] ?? 0),
            'unit_price' => (float) ($line['unit_price'] ?? 0),
            'discount_percent' => (float) ($line['discount_percent'] ?? 0),
            'qty_sent' => 0,
        ], $lines);

        return $this->posting->createWithDetails($header, $mappedLines);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters = []): array
    {
        if (! Schema::hasTable('sales_orders')) {
            return [];
        }

        $q = DB::table('sales_orders as o')
            ->leftJoin('debtors_master as d', 'o.debtor_no', '=', 'd.debtor_no')
            ->where('o.trans_type', 32)
            ->select('o.*', 'd.name as customer_name');

        if (! empty($filters['debtor_no'])) {
            $q->where('o.debtor_no', (int) $filters['debtor_no']);
        }

        return $q->orderByDesc('o.ord_date')->orderByDesc('o.order_no')
            ->limit(200)
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }
}
