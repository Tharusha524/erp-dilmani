<?php

namespace App\Services\Purchasing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PurchInquiryService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function purchaseOrders(array $filters = []): array
    {
        if (! Schema::hasTable('purch_orders')) {
            return [];
        }

        $q = DB::table('purch_orders as po')
            ->leftJoin('suppliers as s', 'po.supplier_id', '=', 's.supplier_id')
            ->select('po.*', 's.supp_name as supplier_name');

        if (! empty($filters['supplier_id'])) {
            $q->where('po.supplier_id', (int) $filters['supplier_id']);
        }
        if (! empty($filters['into_stock_location'])) {
            $q->where('po.into_stock_location', $filters['into_stock_location']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('po.ord_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('po.ord_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['reference'])) {
            $q->where('po.reference', 'like', '%'.$filters['reference'].'%');
        }
        if (! empty($filters['order_no'])) {
            $q->where('po.order_no', (int) $filters['order_no']);
        }
        if (! empty($filters['search_text'])) {
            $q->where(function ($query) use ($filters) {
                $query->where('po.reference', 'like', '%'.$filters['search_text'].'%')
                      ->orWhere('po.order_no', 'like', '%'.$filters['search_text'].'%');
            });
        }
        if (($filters['outstanding'] ?? false) && Schema::hasTable('purch_order_details')) {
            $q->whereExists(function ($sub) {
                $sub->select(DB::raw(1))
                    ->from('purch_order_details as pod')
                    ->whereColumn('pod.order_no', 'po.order_no')
                    ->whereRaw('pod.quantity_received < pod.quantity_ordered');
            });
        }
        if (! empty($filters['item_code']) && Schema::hasTable('purch_order_details')) {
            $q->whereExists(function ($sub) use ($filters) {
                $sub->select(DB::raw(1))
                    ->from('purch_order_details as pod')
                    ->whereColumn('pod.order_no', 'po.order_no')
                    ->where('pod.item_code', 'like', '%'.$filters['item_code'].'%');
            });
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        $rows = $q->orderByDesc('po.ord_date')->orderByDesc('po.order_no')->limit($limit)
            ->get();

        return $rows->map(function ($row) {
            $arr = (array) $row;
            $arr['has_outstanding'] = false;
            if (Schema::hasTable('purch_order_details')) {
                $arr['has_outstanding'] = DB::table('purch_order_details')
                    ->where('order_no', $row->order_no)
                    ->whereRaw('quantity_received < quantity_ordered')
                    ->exists();
            }

            return $arr;
        })->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function supplierTransactions(array $filters = []): array
    {
        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));
        $transTypeFilter = isset($filters['trans_type']) ? (int) $filters['trans_type'] : null;

        if ($transTypeFilter === 25) {
            return array_slice($this->grnTransactionRows($filters), 0, $limit);
        }

        if (! Schema::hasTable('supp_trans')) {
            return array_slice($this->grnTransactionRows($filters), 0, $limit);
        }

        $q = DB::table('supp_trans as t')
            ->leftJoin('suppliers as s', 't.supplier_id', '=', 's.supplier_id')
            ->where('t.ov_amount', '!=', 0)
            ->select('t.*', 's.supp_name as supplier_name', 's.curr_code');

        if (! empty($filters['supplier_id'])) {
            $q->where('t.supplier_id', (int) $filters['supplier_id']);
        }
        if ($transTypeFilter && $transTypeFilter !== 25) {
            $q->where('t.trans_type', $transTypeFilter);
        }
        if (! empty($filters['unsettled'])) {
            $documentExpr = 'ABS(IFNULL(t.ov_amount,0) + IFNULL(t.ov_gst,0) + IFNULL(t.ov_discount,0))';
            $q->whereRaw("ABS({$documentExpr} - ABS(IFNULL(t.alloc,0))) >= 0.01");
        } else {
            if (! empty($filters['from_date'])) {
                $q->where('t.trans_date', '>=', $filters['from_date']);
            }
            if (! empty($filters['to_date'])) {
                $q->where('t.trans_date', '<=', $filters['to_date']);
            }
        }
        if (! empty($filters['overdue_credit'])) {
            $q->where('t.trans_type', 21)
                ->where('t.due_date', '<', now()->toDateString());
        }
        if (! empty($filters['reference'])) {
            $q->where('t.reference', 'like', '%'.$filters['reference'].'%');
        }

        $rows = $q->orderByDesc('t.trans_date')->orderByDesc('t.trans_no')->limit($limit)
            ->get()
            ->map(fn ($row) => $this->mapSupplierTransactionRow($row))
            ->all();

        $includeGrn = ($transTypeFilter === null)
            && empty($filters['unsettled'])
            && empty($filters['overdue_credit']);

        if ($includeGrn) {
            $rows = array_merge($rows, $this->grnTransactionRows($filters));
            usort($rows, function (array $a, array $b) {
                $dateCmp = strcmp((string) ($b['trans_date'] ?? ''), (string) ($a['trans_date'] ?? ''));
                if ($dateCmp !== 0) {
                    return $dateCmp;
                }

                return ((int) ($b['trans_no'] ?? 0)) <=> ((int) ($a['trans_no'] ?? 0));
            });
            $rows = array_slice($rows, 0, $limit);
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function supplierAllocations(array $filters = []): array
    {
        if (! Schema::hasTable('supp_trans')) {
            return [];
        }

        $q = DB::table('supp_trans as t')
            ->leftJoin('suppliers as s', 't.supplier_id', '=', 's.supplier_id')
            ->whereIn('t.trans_type', [20, 21, 22])
            ->select('t.*', 's.supp_name as supplier_name');

        if (! empty($filters['supplier_id'])) {
            $q->where('t.supplier_id', (int) $filters['supplier_id']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('t.trans_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('t.trans_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['trans_type'])) {
            $q->where('t.trans_type', (int) $filters['trans_type']);
        }
        if (! empty($filters['overdue'])) {
            $q->whereIn('t.trans_type', [20, 21])
                ->where('t.due_date', '<', now()->toDateString());
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        $rows = $q->orderBy('t.trans_date')->orderBy('t.trans_no')->limit($limit)
            ->get()->map(function ($row) {
                $documentTotal = $this->suppDocumentTotal($row);
                $allocated = $this->suppAllocatedAmount($row);
                $balance = round(max(0, $documentTotal - $allocated), 2);
                $transType = (int) $row->trans_type;
                $signedTotal = in_array($transType, [21, 22], true) ? -$documentTotal : $documentTotal;

                return [
                    ...(array) $row,
                    'document_total' => round($signedTotal, 2),
                    'allocated' => round($allocated, 2),
                    'balance' => $balance,
                    'settled' => $balance < 0.01,
                ];
            })->all();

        $settledFilter = (string) ($filters['settled'] ?? '');
        if ($settledFilter === 'no') {
            $rows = array_values(array_filter($rows, fn (array $row) => ! $row['settled']));
        } elseif ($settledFilter === 'yes') {
            $rows = array_values(array_filter($rows, fn (array $row) => $row['settled']));
        }

        return $rows;
    }

    /**
     * Open supplier invoices for payment entry (FA supplier_payment.php allocatable list).
     * Excludes purchase orders — including Direct GRN POs which are already received.
     *
     * @return array<int, array<string, mixed>>
     */
    public function supplierPaymentAllocatable(int $supplierId): array
    {
        if ($supplierId <= 0) {
            return [];
        }

        $invoices = $this->supplierAllocations([
            'supplier_id' => $supplierId,
            'trans_type' => 20,
            'settled' => 'no',
            'limit' => 500,
        ]);

        return array_values(array_map(function (array $row) {
            return [
                'id' => 'supp-'.(int) ($row['trans_no'] ?? 0),
                'type' => 'Supplier Invoice',
                'type_code' => 20,
                'number' => (int) ($row['trans_no'] ?? 0),
                'supplier_ref' => (string) ($row['supp_reference'] ?? ''),
                'date' => (string) ($row['trans_date'] ?? ''),
                'due_date' => (string) ($row['due_date'] ?? ''),
                'amount' => round(abs((float) ($row['document_total'] ?? 0)), 2),
                'other_alloc' => round((float) ($row['allocated'] ?? 0), 2),
                'left' => round((float) ($row['balance'] ?? 0), 2),
            ];
        }, $invoices));
    }

    /**
     * GRN lines with quantity not yet invoiced (for supplier invoice / credit note entry).
     *
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function openGrnItems(array $filters = []): array
    {
        if (! Schema::hasTable('grn_items') || ! Schema::hasTable('grn_batch')) {
            return [];
        }

        $q = DB::table('grn_items as gi')
            ->join('grn_batch as gb', 'gi.grn_batch_id', '=', 'gb.id')
            ->leftJoin('purch_orders as po', 'gb.purch_order_no', '=', 'po.order_no')
            ->leftJoin('purch_order_details as pod', 'gi.po_detail_item', '=', 'pod.po_detail_item')
            ->where('gb.reference', '!=', 'auto')
            ->select(
                'gi.id as grn_item_id',
                'gi.grn_batch_id',
                'gi.po_detail_item',
                'gi.item_code',
                'gi.description',
                'gi.qty_recd',
                'gi.quantity_inv',
                DB::raw('(gi.qty_recd - gi.quantity_inv) as qty_open'),
                DB::raw('gi.quantity_inv as qty_invoiced'),
                'gb.id as batch_id',
                'gb.reference as grn_reference',
                'gb.delivery_date',
                'gb.supplier_id',
                'gb.purch_order_no',
                'po.reference as po_reference',
                'pod.unit_price'
            );

        if (! empty($filters['invoiced_only'])) {
            $q->whereRaw('gi.quantity_inv > 0.0001');
        } else {
            $q->whereRaw('gi.qty_recd > gi.quantity_inv + 0.0001');
        }

        if (! empty($filters['supplier_id'])) {
            $q->where('gb.supplier_id', (int) $filters['supplier_id']);
        }
        if (! empty($filters['grn_batch_id'])) {
            $q->where('gb.id', (int) $filters['grn_batch_id']);
        }
        if (! empty($filters['item_code'])) {
            $q->where('gi.item_code', 'like', '%'.$filters['item_code'].'%');
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        return $q->orderByDesc('gb.delivery_date')
            ->orderByDesc('gb.id')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    private function grnTransactionRows(array $filters = []): array
    {
        if (! Schema::hasTable('grn_batch')) {
            return [];
        }

        $q = DB::table('grn_batch as g')
            ->leftJoin('suppliers as s', 'g.supplier_id', '=', 's.supplier_id')
            ->leftJoin('purch_orders as po', 'g.purch_order_no', '=', 'po.order_no')
            ->select(
                'g.id',
                'g.supplier_id',
                'g.reference',
                'g.delivery_date',
                'g.purch_order_no',
                's.supp_name as supplier_name',
                's.curr_code',
                'po.requisition_no as po_requisition_no'
            );

        if (! empty($filters['supplier_id'])) {
            $q->where('g.supplier_id', (int) $filters['supplier_id']);
        }
        if (! empty($filters['from_date'])) {
            $q->where('g.delivery_date', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $q->where('g.delivery_date', '<=', $filters['to_date']);
        }
        if (! empty($filters['reference'])) {
            $q->where('g.reference', 'like', '%'.$filters['reference'].'%');
        }

        return $q->orderByDesc('g.delivery_date')->orderByDesc('g.id')
            ->limit(min(500, max(1, (int) ($filters['limit'] ?? 200))))
            ->get()
            ->map(function ($row) {
                return [
                    'trans_no' => (int) $row->id,
                    'trans_type' => 25,
                    'supplier_id' => (int) $row->supplier_id,
                    'reference' => (string) ($row->reference ?? ''),
                    'supp_reference' => (string) ($row->po_requisition_no ?? ''),
                    'trans_date' => (string) ($row->delivery_date ?? ''),
                    'due_date' => '',
                    'supplier_name' => (string) ($row->supplier_name ?? ''),
                    'curr_code' => (string) ($row->curr_code ?? ''),
                    'ov_amount' => 0,
                    'ov_gst' => 0,
                    'ov_discount' => 0,
                    'alloc' => 0,
                    'document_total' => 0,
                    'amount' => 0,
                    'allocated' => 0,
                    'balance' => 0,
                    'settled' => true,
                    'purch_order_no' => (int) ($row->purch_order_no ?? 0),
                ];
            })
            ->all();
    }

    private function mapSupplierTransactionRow(object $row): array
    {
        $documentTotal = $this->suppDocumentTotal($row);
        $allocated = $this->suppAllocatedAmount($row);
        $balance = round(max(0, $documentTotal - $allocated), 2);
        $rawTotal = $this->suppFaRawTotal($row);

        return [
            ...(array) $row,
            'document_total' => round($rawTotal, 2),
            'amount' => round($rawTotal, 2),
            'allocated' => round($allocated, 2),
            'balance' => $balance,
            'settled' => $balance < 0.01,
        ];
    }

    private function suppFaRawTotal(object $row): float
    {
        return (float) $row->ov_amount
            + (float) ($row->ov_gst ?? 0)
            + (float) ($row->ov_discount ?? 0);
    }

    private function suppDocumentTotal(object $row): float
    {
        return abs($this->suppFaRawTotal($row));
    }

    private function suppAllocatedAmount(object $row): float
    {
        $transNo = (int) $row->trans_no;
        $transType = (int) $row->trans_type;

        if (Schema::hasTable('supp_allocations')) {
            if (in_array($transType, [21, 22], true)) {
                return abs((float) DB::table('supp_allocations')
                    ->where('trans_no_from', $transNo)
                    ->where('trans_type_from', $transType)
                    ->sum('amount'));
            }

            return abs((float) DB::table('supp_allocations')
                ->where('trans_no_to', $transNo)
                ->where('trans_type_to', $transType)
                ->sum('amount'));
        }

        return abs((float) ($row->alloc ?? 0));
    }
}
