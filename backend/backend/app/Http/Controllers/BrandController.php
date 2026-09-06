<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;

/**
 * Simple, optional product-organization data (e.g. "Rani", "Unilever") —
 * pure labels, no GL accounts, no accounting logic reads these.
 */
class BrandController extends Controller
{
    public function index()
    {
        return response()->json(Brand::where('inactive', false)->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        return response()->json(Brand::create($data), 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $brand->update($data);

        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
