<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaxAlgorithmRequest;
use App\Repositories\All\TaxAlgorithm\TaxAlgorithmInterface;

class TaxAlgorithmController extends Controller
{
    private TaxAlgorithmInterface $taxAlgorithm;

    public function __construct(TaxAlgorithmInterface $taxAlgorithm)
    {
        $this->taxAlgorithm = $taxAlgorithm;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->taxAlgorithm->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TaxAlgorithmRequest $request)
    {
        $data = $this->taxAlgorithm->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->taxAlgorithm->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TaxAlgorithmRequest $request, string $id)
    {
        $this->taxAlgorithm->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->taxAlgorithm->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
