<?php

namespace App\Http\Controllers;

use App\Http\Requests\FixedAssetsLocationRequest;
use App\Repositories\All\FixedAssetsLocation\FixedAssetsLocationInterface;
use App\Services\FixedAssets\FaLocationSyncService;

class FixedAssetsLocationController extends Controller
{
    public function __construct(
        private FixedAssetsLocationInterface $locationRepo,
        private FaLocationSyncService $locationSync
    ) {
    }

    public function index()
    {
        return response()->json($this->locationRepo->all(), 200);
    }

    public function store(FixedAssetsLocationRequest $request)
    {
        $location = $this->locationRepo->create($request->validated());
        $this->locationSync->syncFromArray($request->validated());

        return response()->json($location, 201);
    }

    public function show(string $id)
    {
        $location = $this->locationRepo->find($id);

        if (! $location) {
            return response()->json(['message' => 'Location not found'], 404);
        }

        return response()->json($location, 200);
    }

    public function update(FixedAssetsLocationRequest $request, string $id)
    {
        $updated = $this->locationRepo->update($id, $request->validated());

        if (! $updated) {
            return response()->json(['message' => 'Location not found'], 404);
        }

        $this->locationSync->syncFromArray($request->validated());

        return response()->json(['message' => 'Location updated successfully'], 200);
    }

    public function destroy(string $id)
    {
        $deleted = $this->locationRepo->delete($id);

        if (! $deleted) {
            return response()->json(['message' => 'Location not found'], 404);
        }

        return response()->json(['message' => 'Location deleted successfully'], 200);
    }
}
