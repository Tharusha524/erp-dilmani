<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaxGroupRequest;
use App\Repositories\All\TaxGroup\TaxGroupInterface;

class TaxGroupController extends Controller
{
    private TaxGroupInterface $taxGroupRepo;

    public function __construct(TaxGroupInterface $taxGroupRepo)
    {
        $this->taxGroupRepo = $taxGroupRepo;
    }

    public function index()
    {
        return response()->json($this->taxGroupRepo->all());
    }

    public function store(TaxGroupRequest $request)
    {
        $taxGroup = $this->taxGroupRepo->create($request->validated());
        return response()->json($taxGroup, 201);
    }

    public function show(int $id)
    {
        $taxGroup = $this->taxGroupRepo->find($id);
        if (!$taxGroup) {
            return response()->json(['message' => 'Tax group not found'], 404);
        }
        return response()->json($taxGroup);
    }

    public function update(TaxGroupRequest $request, int $id)
    {
        $updated = $this->taxGroupRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Tax group not found'], 404);
        }
        return response()->json($this->taxGroupRepo->find($id));
    }

    public function destroy(int $id)
    {
        $deleted = $this->taxGroupRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Tax group not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully']);
    }
}
