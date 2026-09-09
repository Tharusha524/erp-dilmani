<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Subcategory;
use Illuminate\Http\Request;

/**
 * Product-organization data — a Subcategory belongs to a Brand (e.g. Brand
 * "Unilever" -> Subcategory "Rani Shampoo 250g"), completing the chain
 * Category -> Brand -> Subcategory. category_id is kept in sync from the
 * chosen brand automatically so existing category-based lookups/filters
 * keep working; the real GL account mapping still comes entirely from it.
 */
class SubcategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Subcategory::with(['brand', 'category'])->where('inactive', false)->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->query('brand_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'brand_id' => 'required|integer|exists:brands,id',
            'name' => 'required|string|max:100',
        ]);

        $data['category_id'] = Brand::findOrFail($data['brand_id'])->category_id;

        return response()->json(Subcategory::create($data)->load(['brand', 'category']), 201);
    }

    public function update(Request $request, Subcategory $subcategory)
    {
        $data = $request->validate([
            'brand_id' => 'required|integer|exists:brands,id',
            'name' => 'required|string|max:100',
        ]);

        $data['category_id'] = Brand::findOrFail($data['brand_id'])->category_id;

        $subcategory->update($data);

        return response()->json($subcategory->load(['brand', 'category']));
    }

    public function destroy(Subcategory $subcategory)
    {
        $subcategory->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
