<?php

namespace App\Http\Controllers;

use App\Http\Requests\CrmContactRequest;
use App\Repositories\All\CrmContacts\CrmContactsInterface;

class CrmContactsController extends Controller
{
    private CrmContactsInterface $crmContactsRepo;

    public function __construct(CrmContactsInterface $crmContactsRepo)
    {
        $this->crmContactsRepo = $crmContactsRepo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->crmContactsRepo->all(), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CrmContactRequest $request)
    {
        $data = $request->validated();
        $record = $this->crmContactsRepo->create($data);
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->crmContactsRepo->find($id);
        if (! $record) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json($record, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CrmContactRequest $request, string $id)
    {
        $updated = $this->crmContactsRepo->update($id, $request->validated());
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
        $deleted = $this->crmContactsRepo->delete($id);
        if (! $deleted) {
            return response()->json(['message' => 'Record not found'], 404);
        }
        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}
