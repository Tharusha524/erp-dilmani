<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StandaloneStock;
use Illuminate\Support\Facades\Validator;

class StandaloneStockController extends Controller
{
    public function index()
    {
        $stocks = StandaloneStock::all();
        return response()->json($stocks);
    }

    public function stockIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:standalone_stocks,id',
            'quantity' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $stock = StandaloneStock::find($request->id);
        $stock->quantity += $request->quantity;
        $stock->save();

        return response()->json([
            'message' => 'Stock quantity added successfully',
            'data' => $stock
        ]);
    }

    public function stockOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:standalone_stocks,id',
            'quantity' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $stock = StandaloneStock::find($request->id);
        
        if ($stock->quantity < $request->quantity) {
            return response()->json([
                'errors' => ['quantity' => ['Not enough stock available to remove.']]
            ], 422);
        }

        $stock->quantity -= $request->quantity;
        $stock->save();

        return response()->json([
            'message' => 'Stock quantity deducted successfully',
            'data' => $stock
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $stock = StandaloneStock::create([
            'item_name' => $request->item_name,
            'quantity' => $request->quantity
        ]);

        return response()->json([
            'message' => 'Stock item created successfully',
            'data' => $stock
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $stock = StandaloneStock::find($id);

        if (!$stock) {
            return response()->json(['message' => 'Stock item not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'item_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $stock->update([
            'item_name' => $request->item_name,
            'quantity' => $request->quantity
        ]);

        return response()->json([
            'message' => 'Stock item updated successfully',
            'data' => $stock
        ]);
    }

    public function destroy($id)
    {
        $stock = StandaloneStock::find($id);

        if (!$stock) {
            return response()->json(['message' => 'Stock item not found'], 404);
        }

        $stock->delete();

        return response()->json(['message' => 'Stock item deleted successfully']);
    }
}
