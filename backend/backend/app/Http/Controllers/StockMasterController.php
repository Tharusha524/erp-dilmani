<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockMasterRequest;
use App\Models\StockMaster;
use App\Repositories\All\StockMaster\StockMasterInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StockMasterController extends Controller
{
    private StockMasterInterface $stockMasterRepo;

    public function __construct(StockMasterInterface $stockMasterRepo)
    {
        $this->stockMasterRepo = $stockMasterRepo;
    }

    public function index(Request $request)
    {
        $query = StockMaster::query()->orderBy('stock_id');

        return $this->jsonList($request, $query);
    }

    public function store(StockMasterRequest $request)
    {
        $data = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('stock_images', 'public');
            $data['image'] = $path;
        }

        $stockMaster = $this->stockMasterRepo->create($data);

        return response()->json($stockMaster, 201);
    }

    public function show(string $id)
    {
        $stockMaster = $this->stockMasterRepo->find($id);
        if (!$stockMaster) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }
        return response()->json($stockMaster);
    }

    public function update(StockMasterRequest $request, string $id)
    {
        $stockMaster = $this->stockMasterRepo->find($id);
        if (!$stockMaster) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($stockMaster->image) {
                Storage::disk('public')->delete($stockMaster->image);
            }
            $data['image'] = $request->file('image')->store('stock_images', 'public');
        }

        $updated = $this->stockMasterRepo->update($id, $data);
        if (!$updated) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }
        return response()->json($this->stockMasterRepo->find($id));
    }

    /**
     * Set just the MRP (Maximum Retail Price) for a product — deliberately
     * separate from the full update() above, which requires the whole
     * StockMasterRequest payload (accounts, tax type, category, etc.). This
     * touches only mrp_price, the same "small, isolated field" pattern as
     * Sales Pricing / barcode linking elsewhere in the Supermarket module.
     */
    public function updateMrpPrice(Request $request, string $id)
    {
        $stockMaster = $this->stockMasterRepo->find($id);
        if (!$stockMaster) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }

        $validated = $request->validate([
            'mrp_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $stockMaster->mrp_price = $validated['mrp_price'] ?? null;
        $stockMaster->save();

        return response()->json($stockMaster);
    }

    /**
     * Set just the expiry date — same isolated single-field pattern as
     * updateMrpPrice() above. One expiry date per product master, not
     * per batch/GRN; good enough for a simple expiry list report without
     * needing batch-level stock tracking.
     */
    public function updateExpiryDate(Request $request, string $id)
    {
        $stockMaster = $this->stockMasterRepo->find($id);
        if (!$stockMaster) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }

        $validated = $request->validate([
            'expiry_date' => ['nullable', 'date'],
        ]);

        $stockMaster->expiry_date = $validated['expiry_date'] ?? null;
        $stockMaster->save();

        return response()->json($stockMaster);
    }

    /**
     * Products with an expiry date set, soonest first — flags anything
     * already expired.
     */
    public function expiryList(Request $request)
    {
        $withinDays = (int) $request->query('within_days', 90);
        $cutoff = now()->addDays($withinDays)->toDateString();

        $rows = StockMaster::query()
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $cutoff)
            ->orderBy('expiry_date')
            ->get(['stock_id', 'description', 'expiry_date']);

        $today = now()->toDateString();
        $result = $rows->map(function ($r) use ($today) {
            return [
                'stock_id' => $r->stock_id,
                'description' => $r->description,
                'expiry_date' => $r->expiry_date,
                'status' => $r->expiry_date < $today ? 'expired' : 'expiring_soon',
            ];
        });

        return response()->json($result);
    }

    public function destroy(string $id)
    {
        $deleted = $this->stockMasterRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Stock Master not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
