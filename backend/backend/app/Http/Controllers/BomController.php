<?php

namespace App\Http\Controllers;

use App\Http\Requests\BomRequest;
use App\Models\Bom;
use App\Repositories\All\Bom\BomInterface;
use Illuminate\Http\Request;

class BomController extends Controller
{
    private BomInterface $bom;

    public function __construct(BomInterface $bom)
    {
        $this->bom = $bom;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $parent = trim((string) $request->query('parent', ''));
        if ($parent !== '') {
            return response()->json($this->bom->findByParent($parent));
        }

        return response()->json($this->bom->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BomRequest $request)
    {
        $record = $this->bom->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->bom->find($id);
        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BomRequest $request, string $id)
    {
        $updated = $this->bom->update($id, $request->validated());

        if (! $updated) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->bom->delete($id);

        if (! $deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully']);
    }
}
