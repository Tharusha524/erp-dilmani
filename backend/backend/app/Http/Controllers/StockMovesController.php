<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockMovesRequest;
use App\Repositories\All\StockMoves\StockMovesInterface;
use App\Services\Accounting\PostingsService;
use App\Services\Inventory\LocStockQuantityService;
use App\Support\GlPostingRunner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovesController extends Controller
{
    private StockMovesInterface $stockMovesRepo;

    public function __construct(
        StockMovesInterface $stockMovesRepo,
        protected ?PostingsService $postings = null,
        protected ?LocStockQuantityService $locStockQty = null
    ) {
        $this->stockMovesRepo = $stockMovesRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->stockMovesRepo->all());
    }

    /**
     * A single product's stock movement history — the proposal's "track
     * historical stock information" — most recent first. Read-only report,
     * new/separate from index() above so nothing that already calls
     * index() is affected.
     */
    public function history(Request $request): JsonResponse
    {
        $stockId = trim((string) $request->query('stock_id', ''));
        if ($stockId === '') {
            return response()->json(['message' => 'stock_id is required'], 422);
        }

        $rows = DB::table('stock_moves')
            ->where('stock_id', $stockId)
            ->orderByDesc('tran_date')
            ->orderByDesc('trans_id')
            ->limit(200)
            ->get();

        return response()->json($rows);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StockMovesRequest $request): JsonResponse
    {
        $record = $this->stockMovesRepo->create($request->validated());
        $this->locStockQty?->applyStockMoveRecord($record);

        $glWarning = null;
        if ($this->postings && (int) ($record->type ?? 17) === 17) {
            $run = GlPostingRunner::run(fn () => $this->postings->postStockMove($record));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning($record instanceof \Illuminate\Database\Eloquent\Model ? $record->toArray() : (array) $record, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $record = $this->stockMovesRepo->find($id);
        if (! $record) {
            return response()->json(['message' => 'Stock Move not found'], 404);
        }

        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StockMovesRequest $request, string $id): JsonResponse
    {
        $before = $this->stockMovesRepo->find($id);
        $updated = $this->stockMovesRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Update failed or record not found'], 404);
        }

        $glWarning = null;
        $record = $this->stockMovesRepo->find($id);
        $this->locStockQty?->reconcileStockMoveChange($before, $record);
        if ($this->postings && $record && (int) ($record->type ?? 17) === 17) {
            $run = GlPostingRunner::run(fn () => $this->postings->repostStockMove($record));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated successfully'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $record = $this->stockMovesRepo->find($id);
        if ($record && $this->postings && (int) ($record->type ?? 17) === 17) {
            $transNo = (int) ($record->trans_no ?? 0);
            if ($transNo > 0) {
                $this->postings->deletePostedGl(17, $transNo, ['FA disposal']);
            }
        }

        if ($record) {
            $this->locStockQty?->applyMoveDelta(
                (string) ($record->stock_id ?? ''),
                (string) ($record->loc_code ?? ''),
                -1 * (float) ($record->qty ?? 0)
            );
        }

        $deleted = $this->stockMovesRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Delete failed or record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully']);
    }
}
