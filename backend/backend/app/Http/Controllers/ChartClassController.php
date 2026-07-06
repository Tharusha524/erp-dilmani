<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChartClassRequest;
use App\Repositories\All\ChartClass\ChartClassInterface;
use App\Support\ChartAccountMetadata;
use App\Support\ChartAccountTypeResolver;

class ChartClassController extends Controller
{
    private ChartClassInterface $chartClassRepo;

    public function __construct(ChartClassInterface $chartClassRepo)
    {
        $this->chartClassRepo = $chartClassRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->chartClassRepo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ChartClassRequest $request)
    {
        $class = $this->chartClassRepo->create($request->validated());
        self::clearChartCaches();

        return response()->json($class, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->chartClassRepo->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ChartClassRequest $request, string $id)
    {
        $this->chartClassRepo->update($id, $request->validated());
        self::clearChartCaches();

        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->chartClassRepo->delete($id);
        self::clearChartCaches();

        return response()->json(['message' => 'Deleted successfully']);
    }

    private static function clearChartCaches(): void
    {
        ChartAccountTypeResolver::clearCache();
        ChartAccountMetadata::clearCache();
    }
}
