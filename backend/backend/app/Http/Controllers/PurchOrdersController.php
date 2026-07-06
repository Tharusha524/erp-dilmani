<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostPurchOrderWithDetailsRequest;
use App\Http\Requests\PurchOrdersRequest;
use App\Repositories\All\PurchOrders\PurchOrdersInterface;
use App\Services\Purchasing\PurchOrderPostingService;
use App\Models\PurchOrder;
use Illuminate\Http\Request;

class PurchOrdersController extends Controller
{
    private PurchOrdersInterface $purchOrders;

    public function __construct(
        PurchOrdersInterface $purchOrders,
        private PurchOrderPostingService $posting
    ) {
        $this->purchOrders = $purchOrders;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PurchOrder::query()->orderByDesc('order_no');

        return $this->jsonList($request, $query);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(PurchOrdersRequest $request)
    {
        $purchOrder = $this->purchOrders->create($request->validated());
        return response()->json($purchOrder, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->purchOrders->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(PurchOrdersRequest $request, string $id)
    {
        $this->purchOrders->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->purchOrders->delete($id);
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * FrontAccounting-style: create or update PO header + lines atomically.
     */
    public function postWithDetails(PostPurchOrderWithDetailsRequest $request)
    {
        $validated = $request->validated();
        $header = $validated['header'];
        $lines = $validated['lines'];
        $orderNo = (int) $header['order_no'];
        $existing = \App\Models\PurchOrder::query()->where('order_no', $orderNo)->exists();

        try {
            if ($existing) {
                $result = $this->posting->updateWithDetails(
                    $orderNo,
                    $header,
                    $lines,
                    $validated['delete_detail_ids'] ?? []
                );
            } else {
                $result = $this->posting->createWithDetails($header, $lines);
            }

            return response()->json([
                'order' => $result['order'],
                'lines' => $result['lines'],
                'order_no' => $result['order']->order_no,
            ], $existing ? 200 : 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to save purchase order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function nextOrderNo()
    {
        $max = \DB::table('purch_orders')->max('order_no') ?? 0;

        return response()->json(['order_no' => $max + 1]);
    }

    /**
     * Lines for a purchase order (FrontAccounting po_receive_items).
     */
    public function details(string $orderNo)
    {
        $order = \App\Models\PurchOrder::query()
            ->where('order_no', (int) $orderNo)
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Purchase order not found.'], 404);
        }

        $lines = \App\Models\PurchOrderDetail::query()
            ->where('order_no', (int) $orderNo)
            ->orderBy('po_detail_item')
            ->get();

        return response()->json($lines);
    }
}
