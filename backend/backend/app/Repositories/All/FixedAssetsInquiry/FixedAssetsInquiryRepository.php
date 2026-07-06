<?php

namespace App\Repositories\All\FixedAssetsInquiry;

use App\Models\StockMaster;
use App\Repositories\Base\BaseRepository;
use App\Services\FixedAssets\FaDepreciationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FixedAssetsInquiryRepository extends BaseRepository implements FixedAssetsInquiryInterface
{
    private const STOCK_MOVES_TABLE = 'stock_moves';

    public function __construct(StockMaster $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): Collection
    {
        if (! Schema::hasTable('stock_master')) {
            return collect();
        }

        $showInactive = (bool) ($filters['showInactive'] ?? false);
        $faFlag = FaDepreciationService::FA_MB_FLAG;

        $depSub = Schema::hasTable('fa_depreciation_lines')
            ? DB::table('fa_depreciation_lines')
                ->select('stock_id', DB::raw('SUM(amount) as total_dep'))
                ->groupBy('stock_id')
            : null;

        $query = DB::table('stock_master as sm')
            ->where('sm.mb_flag', $faFlag);

        if (Schema::hasTable('stock_fa_class') && Schema::hasColumn('stock_master', 'fa_class_id')) {
            $query->leftJoin('stock_fa_class as fc', 'sm.fa_class_id', '=', 'fc.fa_class_id');
        }

        if (Schema::hasTable('item_units') && Schema::hasColumn('stock_master', 'units')) {
            $query->leftJoin('item_units as iu', 'sm.units', '=', 'iu.id');
        }

        if ($depSub) {
            $query->leftJoinSub($depSub, 'dep', 'sm.stock_id', '=', 'dep.stock_id');
        }

        if (! $showInactive && Schema::hasColumn('stock_master', 'inactive')) {
            $query->where('sm.inactive', 0);
        }

        $initialExpr = Schema::hasColumn('stock_master', 'purchase_cost')
            ? 'COALESCE(sm.purchase_cost, sm.material_cost, 0)'
            : 'COALESCE(sm.material_cost, 0)';

        $depExpr = $depSub ? 'COALESCE(dep.total_dep, 0)' : '0';

        $classExpr = Schema::hasTable('stock_fa_class')
            ? 'COALESCE(fc.description, sm.fa_class_id, "")'
            : 'COALESCE(sm.fa_class_id, "")';

        $uomParts = [];
        if (Schema::hasTable('item_units')) {
            if (Schema::hasColumn('item_units', 'abbr')) {
                $uomParts[] = 'iu.abbr';
            }
            if (Schema::hasColumn('item_units', 'name')) {
                $uomParts[] = 'iu.name';
            }
        }
        $uomExpr = $uomParts !== [] ? 'COALESCE('.implode(', ', $uomParts).', "")' : '""';

        $rateExpr = Schema::hasTable('stock_fa_class') && Schema::hasColumn('stock_fa_class', 'depreciation_rate')
            ? 'COALESCE(fc.depreciation_rate, sm.depreciation_rate, 0)'
            : 'COALESCE(sm.depreciation_rate, 0)';

        $purchasedExpr = Schema::hasColumn('stock_master', 'depreciation_start')
            ? 'COALESCE(sm.depreciation_start, sm.depreciation_date)'
            : (Schema::hasColumn('stock_master', 'depreciation_date') ? 'sm.depreciation_date' : 'NULL');

        $methodExpr = Schema::hasColumn('stock_master', 'depreciation_method')
            ? "CASE sm.depreciation_method WHEN 'S' THEN 'Straight Line' WHEN 'D' THEN 'Declining Balance' ELSE COALESCE(sm.depreciation_method, '') END"
            : "''";

        $statusExpr = Schema::hasColumn('stock_master', 'inactive')
            ? 'CASE WHEN sm.inactive = 1 THEN "Inactive" ELSE "Active" END'
            : '"Active"';

        return $query
            ->select(
                'sm.stock_id as id',
                DB::raw("{$classExpr} as class"),
                DB::raw("{$uomExpr} as uom"),
                'sm.description',
                DB::raw("{$rateExpr} as rate"),
                DB::raw("{$methodExpr} as method"),
                DB::raw("{$statusExpr} as status"),
                DB::raw("{$purchasedExpr} as purchased"),
                DB::raw("{$initialExpr} as initial"),
                DB::raw("{$depExpr} as depreciations"),
                DB::raw("GREATEST({$initialExpr} - {$depExpr}, 0) as current"),
                DB::raw("'-' as liquidation")
            )
            ->orderBy('sm.stock_id')
            ->get();
    }

    public function searchMovements(array $filters): Collection
    {
        if (! Schema::hasTable(self::STOCK_MOVES_TABLE) || ! Schema::hasTable('stock_master')) {
            return collect();
        }

        $idColumn = $this->stockMoveColumn('trans_id', ['id', 'move_id']);
        $qtyColumn = $this->stockMoveColumn('qty', ['quantity']);
        $dateColumn = $this->stockMoveColumn('tran_date', ['date', 'trans_date']);
        $numberColumn = $this->stockMoveColumn('trans_no', ['type_no']);
        $typeColumn = $this->stockMoveColumn('type', ['trans_type']);
        $locColumn = $this->stockMoveColumn('loc_code', ['location']);
        $stockColumn = $this->stockMoveColumn('stock_id', ['item_code']);

        $hasReference = Schema::hasColumn(self::STOCK_MOVES_TABLE, 'reference');
        $hasRefAlias = ! $hasReference && Schema::hasColumn(self::STOCK_MOVES_TABLE, 'ref');
        $referenceExpr = $hasReference
            ? 'smv.reference'
            : ($hasRefAlias ? 'smv.ref' : "''");

        $faFlag = FaDepreciationService::FA_MB_FLAG;
        $stockId = $filters['stockId'] ?? $filters['stock_id'] ?? '';
        $location = $filters['location'] ?? '';
        $fromDate = $filters['fromDate'] ?? '';
        $toDate = $filters['toDate'] ?? '';

        $typeExpr = Schema::hasTable('trans_types')
            ? "COALESCE(tt.description, CAST(smv.{$typeColumn} AS CHAR))"
            : "CAST(smv.{$typeColumn} AS CHAR)";

        $query = DB::table(self::STOCK_MOVES_TABLE.' as smv')
            ->join('stock_master as sm', "smv.{$stockColumn}", '=', 'sm.stock_id')
            ->where('sm.mb_flag', $faFlag);

        if (Schema::hasTable('trans_types')) {
            $query->leftJoin('trans_types as tt', "smv.{$typeColumn}", '=', 'tt.trans_type');
        }

        $query->select(
            DB::raw("smv.{$idColumn} as id"),
            DB::raw("{$typeExpr} as type"),
            DB::raw("smv.{$numberColumn} as number"),
            DB::raw("{$referenceExpr} as reference"),
            DB::raw("smv.{$dateColumn} as date"),
            DB::raw("smv.{$locColumn} as loc_code"),
            DB::raw("smv.{$qtyColumn} as qty"),
            DB::raw("smv.{$stockColumn} as stock_id"),
            DB::raw("COALESCE({$referenceExpr}, '') as detail")
        )
            ->orderBy("smv.{$dateColumn}")
            ->orderBy("smv.{$idColumn}");

        if ($stockId !== '') {
            $query->where("smv.{$stockColumn}", $stockId);
        }
        if ($location !== '') {
            $query->where("smv.{$locColumn}", $location);
        }
        if ($fromDate) {
            $query->where("smv.{$dateColumn}", '>=', $fromDate);
        }
        if ($toDate) {
            $query->where("smv.{$dateColumn}", '<=', $toDate);
        }

        $running = 0.0;
        if ($fromDate || $stockId !== '' || $location !== '') {
            $openQuery = DB::table(self::STOCK_MOVES_TABLE.' as smv')
                ->join('stock_master as sm', "smv.{$stockColumn}", '=', 'sm.stock_id')
                ->where('sm.mb_flag', $faFlag);

            if ($stockId !== '') {
                $openQuery->where("smv.{$stockColumn}", $stockId);
            }
            if ($location !== '') {
                $openQuery->where("smv.{$locColumn}", $location);
            }
            if ($fromDate) {
                $openQuery->where("smv.{$dateColumn}", '<', $fromDate);
            }

            $running = (float) $openQuery->sum("smv.{$qtyColumn}");
        }

        $rows = $query->get();

        return $rows->map(function ($row) use (&$running) {
            $qty = (float) $row->qty;
            $running += $qty;

            return [
                'id' => $row->id,
                'type' => $row->type,
                'number' => $row->number,
                'reference' => $row->reference,
                'date' => $row->date,
                'loc_code' => $row->loc_code,
                'detail' => $row->detail,
                'quantityIn' => $qty > 0 ? round($qty, 2) : 0,
                'quantityOut' => $qty < 0 ? round(abs($qty), 2) : 0,
                'quantityOnHand' => round($running, 2),
                'stock_id' => $row->stock_id,
            ];
        });
    }

    /**
     * @param  list<string>  $alternatives
     */
    private function stockMoveColumn(string $preferred, array $alternatives = []): string
    {
        if (Schema::hasColumn(self::STOCK_MOVES_TABLE, $preferred)) {
            return $preferred;
        }

        foreach ($alternatives as $column) {
            if (Schema::hasColumn(self::STOCK_MOVES_TABLE, $column)) {
                return $column;
            }
        }

        throw new \InvalidArgumentException(
            'The stock_moves table is missing required column "'.$preferred.'".'
        );
    }
}
