<?php

namespace App\Services\Manufacturing;

use App\Support\CompanySetupSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting-style work order search (search_work_orders.php / get_sql_for_work_orders).
 */
class ManufacturingInquiryService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function searchWorkOrders(array $filters = []): array
    {
        if (! Schema::hasTable('workorders')) {
            return [];
        }

        $q = DB::table('workorders as wo')
            ->leftJoin('stock_master as sm', 'wo.stock_id', '=', 'sm.stock_id')
            ->leftJoin('inventory_locations as loc', 'wo.loc_code', '=', 'loc.loc_code');

        $select = [
            'wo.id',
            'wo.wo_ref',
            'wo.loc_code',
            'wo.units_reqd',
            'wo.stock_id',
            'wo.date',
            'wo.type',
            'wo.required_by',
            'wo.released_date',
            'wo.units_issued',
            'wo.closed',
            'wo.released',
            'wo.additional_costs',
            'wo.created_at',
            'wo.updated_at',
            'sm.description as item_description',
            'loc.location_name',
        ];

        if (Schema::hasTable('item_units') && Schema::hasColumn('stock_master', 'units')) {
            $q->leftJoin('item_units as iu', 'sm.units', '=', 'iu.abbr');
            $select[] = 'iu.decimals';
        }

        $q->select($select);

        $outstandingOnly = filter_var($filters['outstanding_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $openOnly = filter_var($filters['open_only'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($outstandingOnly || $openOnly) {
            $q->where('wo.closed', 0);
        }

        $orderNo = trim((string) ($filters['order_no'] ?? ''));
        if ($orderNo !== '') {
            if (ctype_digit($orderNo)) {
                $q->where('wo.id', (int) $orderNo);
            } else {
                $q->where('wo.id', 'like', '%'.$orderNo.'%');
            }
        } else {
            $reference = trim((string) ($filters['reference'] ?? ''));
            if ($reference !== '') {
                $q->where('wo.wo_ref', 'like', '%'.$reference.'%');
            }

            $locCode = trim((string) ($filters['loc_code'] ?? ''));
            if ($locCode !== '' && strtoupper($locCode) !== 'ALL') {
                $q->where('wo.loc_code', $locCode);
            }

            $stockId = trim((string) ($filters['stock_id'] ?? ''));
            if ($stockId !== '' && strtoupper($stockId) !== 'ALL') {
                $q->where('wo.stock_id', $stockId);
            }

            if (filter_var($filters['overdue_only'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $q->whereNotNull('wo.required_by')
                    ->whereDate('wo.required_by', '<', now()->toDateString());
            }
        }

        $limit = min(500, max(1, (int) ($filters['limit'] ?? 200)));

        return $q->orderByDesc('wo.id')
            ->limit($limit)
            ->get()
            ->map(function ($row) {
                $arr = (array) $row;
                $arr['is_overdue'] = ! (bool) ($row->closed ?? false)
                    && ! empty($row->required_by)
                    && (string) $row->required_by < now()->toDateString();

                return $arr;
            })
            ->all();
    }

    /**
     * FrontAccounting bom_cost_inquiry / get_bom().
     *
     * @return array<string, mixed>
     */
    public function costedBom(string $parentStockId): array
    {
        $parentStockId = trim($parentStockId);
        $empty = [
            'parent' => $parentStockId,
            'parent_description' => '',
            'lines' => [],
            'labour_cost' => 0.0,
            'overhead_cost' => 0.0,
            'total_cost' => 0.0,
            'currency' => CompanySetupSettings::resolveCurrency(null),
        ];

        if ($parentStockId === '' || ! Schema::hasTable('bom')) {
            return $empty;
        }

        $parent = DB::table('stock_master')->where('stock_id', $parentStockId)->first();
        if (! $parent) {
            return $empty;
        }

        $lines = DB::table('bom as b')
            ->join('stock_master as c', 'b.component', '=', 'c.stock_id')
            ->leftJoin('work_centres as wc', 'b.work_centre', '=', 'wc.id')
            ->leftJoin('inventory_locations as loc', 'b.loc_code', '=', 'loc.loc_code')
            ->where('b.parent', $parentStockId)
            ->orderBy('b.id')
            ->select([
                'b.component',
                'c.description as component_description',
                'wc.name as work_centre_name',
                'loc.location_name',
                'b.quantity',
                'c.material_cost',
                'c.purchase_cost',
            ])
            ->get()
            ->map(function ($row) {
                $unitCost = $this->resolveMaterialCost($row);
                $qty = (float) ($row->quantity ?? 0);

                return [
                    'component' => $row->component,
                    'description' => $row->component_description ?? '',
                    'work_centre' => $row->work_centre_name ?? '',
                    'location' => $row->location_name ?? '',
                    'quantity' => $qty,
                    'unit_cost' => round($unitCost, 2),
                    'cost' => round($qty * $unitCost, 2),
                ];
            })
            ->all();

        $labour = round((float) ($parent->labour_cost ?? 0), 2);
        $overhead = round((float) ($parent->overhead_cost ?? 0), 2);
        $materialTotal = array_sum(array_column($lines, 'cost'));

        return [
            'parent' => $parentStockId,
            'parent_description' => $parent->description ?? '',
            'lines' => $lines,
            'labour_cost' => $labour,
            'overhead_cost' => $overhead,
            'total_cost' => round($materialTotal + $labour + $overhead, 2),
            'currency' => CompanySetupSettings::resolveCurrency(null),
        ];
    }

    /**
     * FrontAccounting where_used_inquiry / get_sql_for_where_used().
     *
     * @return array<int, array<string, mixed>>
     */
    public function whereUsed(string $componentStockId): array
    {
        $componentStockId = trim($componentStockId);
        if ($componentStockId === '' || ! Schema::hasTable('bom')) {
            return [];
        }

        return DB::table('bom as b')
            ->join('stock_master as parent', 'b.parent', '=', 'parent.stock_id')
            ->leftJoin('work_centres as wc', 'b.work_centre', '=', 'wc.id')
            ->leftJoin('inventory_locations as loc', 'b.loc_code', '=', 'loc.loc_code')
            ->where('b.component', $componentStockId)
            ->orderBy('b.parent')
            ->orderBy('b.id')
            ->select([
                'b.parent',
                'parent.description as parent_description',
                'wc.name as work_centre_name',
                'loc.location_name',
                'b.quantity',
            ])
            ->get()
            ->map(function ($row) {
                $parent = (string) ($row->parent ?? '');
                $description = (string) ($row->parent_description ?? '');

                return [
                    'parent' => $parent,
                    'parent_label' => $description !== '' ? $parent.' - '.$description : $parent,
                    'work_centre' => $row->work_centre_name ?? '',
                    'location' => $row->location_name ?? '',
                    'quantity' => (float) ($row->quantity ?? 0),
                ];
            })
            ->all();
    }

    private function resolveMaterialCost(object $stockRow): float
    {
        $material = (float) ($stockRow->material_cost ?? 0);
        if ($material > 0) {
            return $material;
        }

        return max(0.0, (float) ($stockRow->purchase_cost ?? 0));
    }
}
