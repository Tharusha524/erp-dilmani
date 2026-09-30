<?php

namespace App\Http\Controllers;

use App\Models\PromotionalPrice;
use Illuminate\Http\Request;

class PromotionalPriceController extends Controller
{
    public function index(Request $request)
    {
        $query = PromotionalPrice::with('stock')->orderByDesc('id');

        if ($request->filled('stock_id')) {
            $query->where('stock_id', $request->query('stock_id'));
        }
        if ($request->boolean('active_only')) {
            $today = now()->toDateString();
            $query->where('active', true)
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'stock_id' => 'required|exists:stock_master,stock_id',
            'promo_price' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $promo = PromotionalPrice::create($data);
        return response()->json($promo, 201);
    }

    public function update(Request $request, int $id)
    {
        $promo = PromotionalPrice::find($id);
        if (!$promo) {
            return response()->json(['message' => 'Promotional price not found'], 404);
        }

        $data = $request->validate([
            'promo_price' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'active' => 'nullable|boolean',
        ]);

        $promo->update($data);
        return response()->json($promo);
    }

    public function destroy(int $id)
    {
        $promo = PromotionalPrice::find($id);
        if (!$promo) {
            return response()->json(['message' => 'Promotional price not found'], 404);
        }
        $promo->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
