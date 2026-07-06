<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChartTypeRequest;
use App\Repositories\All\ChartType\ChartTypeInterface;
use App\Support\ChartAccountMetadata;
use App\Support\ChartAccountTypeResolver;

class ChartTypeController extends Controller
{
    private ChartTypeInterface $chartTypeRepo;

    public function __construct(ChartTypeInterface $chartTypeRepo)
    {
        $this->chartTypeRepo = $chartTypeRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->chartTypeRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ChartTypeRequest $request)
    {
        $chartType = $this->chartTypeRepo->create($request->validated());
        self::clearChartCaches();

        return response()->json($chartType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $chartType = $this->chartTypeRepo->find($id);
        if (! $chartType) {
            return response()->json(['error' => 'Chart Type not found'], 404);
        }
        return response()->json($chartType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ChartTypeRequest $request, string $id)
    {
        $updated = $this->chartTypeRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['error' => 'Chart Type not found'], 404);
        }
        self::clearChartCaches();

        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->chartTypeRepo->delete($id);
        if (! $deleted) {
            return response()->json(['error' => 'Chart Type not found'], 404);
        }
        self::clearChartCaches();

        return response()->json(['message' => 'Deleted successfully']);
    }

    private static function clearChartCaches(): void
    {
        ChartAccountTypeResolver::clearCache();
        ChartAccountMetadata::clearCache();
    }
}
