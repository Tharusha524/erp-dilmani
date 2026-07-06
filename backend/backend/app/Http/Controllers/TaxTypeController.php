<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaxTypeRequest;
use App\Repositories\All\TaxType\TaxTypeInterface;

class TaxTypeController extends Controller
{
    private TaxTypeInterface $taxTypeRepo;

    public function __construct(TaxTypeInterface $taxTypeRepo)
    {
        $this->taxTypeRepo = $taxTypeRepo;
    }

    public function index()
    {
        return response()->json($this->taxTypeRepo->allWithRelations());
    }

    public function store(TaxTypeRequest $request)
    {
        $taxType = $this->taxTypeRepo->create($request->validated());
        return response()->json($taxType, 201);
    }

    public function show(int $id)
    {
        $taxType = $this->taxTypeRepo->find($id);
        if (!$taxType) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json($taxType);
    }

    public function update(TaxTypeRequest $request, int $id)
    {
        $updated = $this->taxTypeRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json($this->taxTypeRepo->find($id));
    }

    public function destroy(int $id)
    {
        $deleted = $this->taxTypeRepo->delete($id);
        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }
        return response()->json(['message' => 'Deleted Successfully']);
    }
}
