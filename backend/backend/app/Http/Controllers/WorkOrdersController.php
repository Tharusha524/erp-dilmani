<?php

namespace App\Http\Controllers;

use App\Http\Requests\WorkOrdersRequest;
use App\Models\WorkOrder;
use App\Repositories\All\WorkOrders\WorkOrdersInterface;
use Illuminate\Http\Request;

class WorkOrdersController extends Controller
{
    private WorkOrdersInterface $workOrders;

    public function __construct(WorkOrdersInterface $workOrders)
    {
        $this->workOrders = $workOrders;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = WorkOrder::query()
            ->with(['stock:stock_id,description', 'location:loc_code,location_name'])
            ->orderByDesc('id');

        return $this->jsonList($request, $query);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(WorkOrdersRequest $request)
    {
        $record = $this->workOrders->create($request->validated());
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
         return response()->json($this->workOrders->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(WorkOrdersRequest $request, string $id)
    {
        $this->workOrders->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->workOrders->delete($id);
        return response()->json(['message' => 'Deleted']);
    }
}
