<?php

namespace App\Http\Controllers;

use App\Http\Requests\RevaluateCurrencyRequest;
use App\Repositories\All\RevaluateCurrency\RevaluateCurrencyInterface;
use Illuminate\Http\Request;

class RevaluateCurrencyController extends Controller
{
    private RevaluateCurrencyInterface $revaluateCurrencyRepo;

    public function __construct(RevaluateCurrencyInterface $revaluateCurrencyRepo)
    {
        $this->revaluateCurrencyRepo = $revaluateCurrencyRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->revaluateCurrencyRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RevaluateCurrencyRequest $request)
    {
        $data = $request->validated();
        $record = $this->revaluateCurrencyRepo->create($data);
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->revaluateCurrencyRepo->find($id);
        if (! $record) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($record, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RevaluateCurrencyRequest $request, string $id)
    {
        $updated = $this->revaluateCurrencyRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Updated successfully'], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->revaluateCurrencyRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
