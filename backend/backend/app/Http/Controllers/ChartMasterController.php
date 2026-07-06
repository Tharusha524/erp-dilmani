<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChartMasterRequest;
use App\Repositories\All\ChartMaster\ChartMasterInterface;
use App\Support\ChartAccountMetadata;
use App\Support\ChartAccountTypeResolver;

class ChartMasterController extends Controller
{
    private ChartMasterInterface $chartMasterRepo;

    public function __construct(ChartMasterInterface $chartMasterRepo)
    {
        $this->chartMasterRepo = $chartMasterRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->chartMasterRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ChartMasterRequest $request)
    {
        $chartMaster = $this->chartMasterRepo->create($request->validated());
        self::clearChartCaches();

        return response()->json($chartMaster, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $chartMaster = $this->chartMasterRepo->find($id);
        if (! $chartMaster) {
            return response()->json(['error' => 'Chart Master not found'], 404);
        }
        return response()->json($chartMaster);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ChartMasterRequest $request, string $id)
    {
        $updated = $this->chartMasterRepo->update($id, $request->validated());
        if (! $updated) {
            return response()->json(['error' => 'Chart Master not found'], 404);
        }
        self::clearChartCaches();

        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->chartMasterRepo->delete($id);
        if (! $deleted) {
            return response()->json(['error' => 'Chart Master not found'], 404);
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
