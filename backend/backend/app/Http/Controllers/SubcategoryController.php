<?php

namespace App\Http\Controllers;

use App\Models\Subcategory;
use Illuminate\Http\Request;

/**
 * Simple, optional product-organization data — one level under an existing
 * Category (e.g. Category "Grocery" -> Subcategory "Soup"). Pure labels;
 * the real GL account mapping still comes entirely from category_id.
 */
class SubcategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Subcategory::where('inactive', false)->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|integer|exists:item_category,category_id',
            'name' => 'required|string|max:100',
        ]);

        return response()->json(Subcategory::create($data), 201);
    }

    public function update(Request $request, Subcategory $subcategory)
    {
        $data = $request->validate([
            'category_id' => 'required|integer|exists:item_category,category_id',
            'name' => 'required|string|max:100',
        ]);

        $subcategory->update($data);

        return response()->json($subcategory);
    }

    public function destroy(Subcategory $subcategory)
    {
        $subcategory->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
