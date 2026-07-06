<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreditStatusSetupRequest;
use App\Models\CreditStatusSetup;
use App\Repositories\All\CreditStatusSetup\CreditStatusSetupInterface;
use Illuminate\Http\Request;

class CreditStatusSetupController extends Controller
{   
    private CreditStatusSetupInterface $repo;

    public function __construct(CreditStatusSetupInterface $repo)
    {
        $this->repo = $repo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all(), 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreditStatusSetupRequest $request)
    {
        $CreditStatusSetup = $this->repo->create($request->validated());
        return response()->json($CreditStatusSetup, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $CreditStatusSetup = $this->repo->find($id);

        if (!$CreditStatusSetup) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($CreditStatusSetup, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CreditStatusSetupRequest $request, string $id)
    {
        $updated = $this->repo->update($id, $request->validated());

        if (!$updated) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json($updated, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
