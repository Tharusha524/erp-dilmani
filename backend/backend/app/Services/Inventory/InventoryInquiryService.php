<?php

namespace App\Services\Inventory;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InventoryInquiryService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *     qoh_before: float,
     *     qoh_after: float,
     *     rows: array<int, array<string, mixed>>
     * }
     */
    public function itemMovements(array $filters): array
    {
        $stockId = trim((string) ($filters['stock_id'] ?? ''));
        if ($stockId === '' || ! Schema::hasTable('stock_moves')) {
            return ['qoh_before' => 0, 'qoh_after' => 0, 'rows' => []];
        }

        $locCode = strtoupper(trim((string) ($filters['loc_code'] ?? '')));
        $fromDate = (string) ($filters['from_date'] ?? '');
        $toDate = (string) ($filters['to_date'] ?? '');

        $typeNames = $this->transTypeNames();
        $locationTable = Schema::hasTable('inventory_locations') ? 'inventory_locations' : 'locations';

        $qohBefore = $this->quantityOnHandBefore($stockId, $locCode, $fromDate);

        $q = DB::table('stock_moves as m')
            ->leftJoin("{$locationTable} as l", 'm.loc_code', '=', 'l.loc_code')
            ->where('m.stock_id', $stockId)
            ->select('m.*', 'l.location_name');

        if ($locCode !== '') {
            $q->where('m.loc_code', $locCode);
        }
        if ($fromDate !== '') {
            $q->where('m.tran_date', '>=', $fromDate);
        }
        if ($toDate !== '') {
            $q->where('m.tran_date', '<=', $toDate);
        }

        $moves = $q->orderBy('m.tran_date')->orderBy('m.trans_id')->get();

        $running = $qohBefore;
        $rows = [];
        foreach ($moves as $move) {
            $qty = (float) ($move->qty ?? 0);
            $running = round($running + $qty, 4);
            $type = (int) ($move->type ?? 0);

            $rows[] = [
                'trans_id' => (int) ($move->trans_id ?? 0),
                'type' => $type,
                'type_name' => $typeNames[$type] ?? (string) $type,
                'trans_no' => (int) ($move->trans_no ?? 0),
                'reference' => (string) ($move->reference ?? ''),
                'loc_code' => (string) ($move->loc_code ?? ''),
                'location_name' => (string) ($move->location_name ?? $move->loc_code ?? ''),
                'tran_date' => (string) ($move->tran_date ?? ''),
                'detail' => $this->movementDetail($type, (int) ($move->trans_no ?? 0)),
                'quantity_in' => $qty > 0 ? round($qty, 4) : 0,
                'quantity_out' => $qty < 0 ? round(abs($qty), 4) : 0,
                'quantity_on_hand' => $running,
            ];
        }

        $qohAfter = $toDate !== ''
            ? $this->quantityOnHandBefore($stockId, $locCode, $toDate, true)
            : $running;

        return [
            'qoh_before' => round($qohBefore, 4),
            'qoh_after' => round($qohAfter, 4),
            'rows' => $rows,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function itemStatus(string $stockId): array
    {
        $stockId = trim($stockId);
        if ($stockId === '' || ! Schema::hasTable('stock_moves')) {
            return [];
        }

        $locationTable = Schema::hasTable('inventory_locations') ? 'inventory_locations' : 'locations';
        if (! Schema::hasTable($locationTable)) {
            return [];
        }

        $locations = DB::table($locationTable)->orderBy('loc_code')->get();
        $demandByLoc = $this->demandByLocation($stockId);
        $onOrderByLoc = $this->onOrderByLocation($stockId);
        $reorderByLoc = $this->reorderLevels($stockId);

        $rows = [];
        foreach ($locations as $loc) {
            $locCode = (string) ($loc->loc_code ?? '');
            $qoh = $this->currentQuantityOnHand($stockId, $locCode);
            $demand = round((float) ($demandByLoc[$locCode] ?? 0), 4);
            $onOrder = round((float) ($onOrderByLoc[$locCode] ?? 0), 4);

            $rows[] = [
                'loc_code' => $locCode,
                'location' => (string) ($loc->location_name ?? $locCode),
                'quantity_on_hand' => round($qoh, 4),
                'reorder_level' => round((float) ($reorderByLoc[$locCode] ?? 0), 4),
                'demand' => $demand,
                'available' => round(max(0, $qoh - $demand), 4),
                'on_order' => $onOrder,
            ];
        }

        return $rows;
    }

    private function currentQuantityOnHand(string $stockId, string $locCode): float
    {
        if (Schema::hasTable('loc_stock') && Schema::hasColumn('loc_stock', 'quantity')) {
            $qty = DB::table('loc_stock')
                ->where('stock_id', $stockId)
                ->where('loc_code', $locCode)
                ->value('quantity');

            if ($qty !== null) {
                return (float) $qty;
            }
        }

        if (! Schema::hasTable('stock_moves')) {
            return 0;
        }

        return (float) DB::table('stock_moves')
            ->where('stock_id', $stockId)
            ->where('loc_code', $locCode)
            ->sum('qty');
    }

    private function quantityOnHandBefore(
        string $stockId,
        string $locCode,
        string $beforeDate,
        bool $inclusive = false
    ): float {
        if ($beforeDate === '' || ! Schema::hasTable('stock_moves')) {
            return 0;
        }

        $q = DB::table('stock_moves')
            ->where('stock_id', $stockId);

        if ($locCode !== '') {
            $q->where('loc_code', $locCode);
        }

        if ($inclusive) {
            $q->where('tran_date', '<=', $beforeDate);
        } else {
            $q->where('tran_date', '<', $beforeDate);
        }

        return (float) $q->sum('qty');
    }

    /**
     * @return array<string, float>
     */
    private function demandByLocation(string $stockId): array
    {
        if (! Schema::hasTable('sales_order_details') || ! Schema::hasTable('sales_orders')) {
            return [];
        }

        $rows = DB::table('sales_order_details as line')
            ->join('sales_orders as so', 'line.order_no', '=', 'so.order_no')
            ->where('line.stk_code', $stockId)
            ->where('so.trans_type', 30)
            ->where('line.trans_type', 30)
            ->whereRaw('line.quantity - line.qty_sent > 0.0001')
            ->select(
                'so.from_stk_loc as loc_code',
                DB::raw('SUM(line.quantity - line.qty_sent) as demand')
            )
            ->groupBy('so.from_stk_loc')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[strtoupper((string) ($row->loc_code ?? ''))] = (float) ($row->demand ?? 0);
        }

        return $map;
    }

    /**
     * @return array<string, float>
     */
    private function onOrderByLocation(string $stockId): array
    {
        if (! Schema::hasTable('purch_order_details') || ! Schema::hasTable('purch_orders')) {
            return [];
        }

        $rows = DB::table('purch_order_details as line')
            ->join('purch_orders as po', 'line.order_no', '=', 'po.order_no')
            ->where('line.item_code', $stockId)
            ->whereRaw('line.quantity_ordered - line.quantity_received > 0.0001')
            ->select(
                'po.into_stock_location as loc_code',
                DB::raw('SUM(line.quantity_ordered - line.quantity_received) as on_order')
            )
            ->groupBy('po.into_stock_location')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[strtoupper((string) ($row->loc_code ?? ''))] = (float) ($row->on_order ?? 0);
        }

        return $map;
    }

    /**
     * @return array<string, float>
     */
    private function reorderLevels(string $stockId): array
    {
        if (! Schema::hasTable('loc_stock')) {
            return [];
        }

        $rows = DB::table('loc_stock')
            ->where('stock_id', $stockId)
            ->select('loc_code', 'reorder_level')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[strtoupper((string) ($row->loc_code ?? ''))] = (float) ($row->reorder_level ?? 0);
        }

        return $map;
    }

    /**
     * @return array<int, string>
     */
    private function transTypeNames(): array
    {
        if (! Schema::hasTable('trans_types')) {
            return [];
        }

        return DB::table('trans_types')
            ->pluck('description', 'trans_type')
            ->mapWithKeys(fn ($desc, $type) => [(int) $type => (string) $desc])
            ->all();
    }

    private function movementDetail(int $type, int $transNo): string
    {
        if ($transNo <= 0) {
            return '';
        }

        try {
            if (in_array($type, [20, 21, 22], true) && Schema::hasTable('supp_trans')) {
                $name = DB::table('supp_trans as t')
                    ->join('suppliers as s', 't.supplier_id', '=', 's.supplier_id')
                    ->where('t.trans_type', $type)
                    ->where('t.trans_no', $transNo)
                    ->value('s.supp_name');

                return $name ? (string) $name : '';
            }

            if (in_array($type, [10, 11, 12, 13], true) && Schema::hasTable('debtor_trans')) {
                $name = DB::table('debtor_trans as t')
                    ->join('debtors_master as d', 't.debtor_no', '=', 'd.debtor_no')
                    ->where('t.trans_type', $type)
                    ->where('t.trans_no', $transNo)
                    ->value('d.name');

                return $name ? (string) $name : '';
            }
        } catch (\Throwable) {
            return '';
        }

        return '';
    }
}
