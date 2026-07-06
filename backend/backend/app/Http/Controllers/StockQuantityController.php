<?php

namespace App\Http\Controllers;

use App\Services\FixedAssets\FaStockMoveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StockQuantityController extends Controller
{
    public function __construct(private FaStockMoveService $stockMoves)
    {
    }

    /** GET /api/inventory/qoh?stock_id=&loc_code= */
    public function show(Request $request): JsonResponse
    {
        $stockId = trim((string) $request->query('stock_id', ''));
        $locCode = strtoupper(trim((string) $request->query('loc_code', '')));

        if ($stockId === '' || ! Schema::hasTable('stock_moves')) {
            return response()->json(['stock_id' => $stockId, 'loc_code' => $locCode, 'qty' => 0]);
        }

        if ($locCode !== '') {
            $qty = $this->stockMoves->quantityOnHand($stockId, $locCode);
        } else {
            $stockColumn = Schema::hasColumn('stock_moves', 'stock_id') ? 'stock_id' : 'item_code';
            $qtyColumn = Schema::hasColumn('stock_moves', 'qty') ? 'qty' : 'quantity';
            $qty = (float) DB::table('stock_moves')->where($stockColumn, $stockId)->sum($qtyColumn);
        }

        return response()->json([
            'stock_id' => $stockId,
            'loc_code' => $locCode ?: null,
            'qty' => round($qty, 4),
        ]);
    }
}
