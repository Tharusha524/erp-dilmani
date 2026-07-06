<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchDataRequest;
use App\Repositories\All\PurchData\PurchDataInterface;

class PurchDataController extends Controller
{
    private PurchDataInterface $purchDataRepository;

    public function __construct(PurchDataInterface $purchDataRepository)
    {
        $this->purchDataRepository = $purchDataRepository;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->purchDataRepository->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PurchDataRequest $request)
    {
        $data = $this->purchDataRepository->create($request->validated());
        return response()->json($data, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $data = $this->purchDataRepository->find($id);
        if (!$data) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PurchDataRequest $request, string $id)
    {
        $updated = $this->purchDataRepository->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Record not found or not updated'], 404);
        }

        return response()->json(['message' => 'Updated successfully']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->purchDataRepository->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Record not found or could not be deleted'], 404);
        }

        return response()->json(['message' => 'Deleted successfully']);
    }
}
