<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostSalesOrderWithDetailsRequest;
use App\Http\Requests\SalesOrdersRequest;
use App\Repositories\All\SalesOrders\SalesOrdersInterface;
use App\Services\Sales\CustomerCreditService;
use App\Services\Sales\SalesOrderPostingService;
use App\Models\SalesOrder;
use Illuminate\Http\Request;

class SalesOrdersController extends Controller
{
    private SalesOrdersInterface $salesOrders;

    public function __construct(
        SalesOrdersInterface $salesOrders,
        private SalesOrderPostingService $posting,
        private CustomerCreditService $customerCredit
    ) {
        $this->salesOrders = $salesOrders;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SalesOrder::query()->orderByDesc('order_no');

        return $this->jsonList($request, $query);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SalesOrdersRequest $request)
    {
        $data = $request->validated();

        $debtorNo = (int) ($data['debtor_no'] ?? 0);
        $orderTotal = (float) ($data['total'] ?? 0);
        if ($debtorNo > 0 && $orderTotal > 0) {
            try {
                $this->customerCredit->assertCanExtendCredit($debtorNo, $orderTotal);
            } catch (\InvalidArgumentException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        // Try to create; if duplicate primary (order_no) occurs, retry with next available order_no
        $attempts = 0;
        while ($attempts < 3) {
            try {
                $salesOrder = $this->salesOrders->create($data);
                return response()->json($salesOrder, 201);
            } catch (\Illuminate\Database\QueryException $e) {
                $attempts++;
                // Duplicate entry for primary key
                if ($e->getCode() == '23000') {
                    // compute next order_no and retry
                    $max = \DB::table('sales_orders')->max('order_no') ?? 0;
                    $data['order_no'] = $max + 1;
                    continue;
                }
                // rethrow other DB errors
                throw $e;
            }
        }

        // If still failing after retries, return conflict
        return response()->json(['message' => 'Unable to allocate unique order_no after retries'], 409);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->salesOrders->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SalesOrdersRequest $request, string $id)
    {
        $this->salesOrders->update($id, $request->validated());
        return response()->json(['message' => 'Updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->salesOrders->delete($id);
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * FrontAccounting-style: create or update order header + lines atomically.
     */
    public function postWithDetails(PostSalesOrderWithDetailsRequest $request)
    {
        $validated = $request->validated();
        $header = $validated['header'];
        $lines = $validated['lines'];
        $orderNo = (int) $header['order_no'];
        $existing = \App\Models\SalesOrder::query()->where('order_no', $orderNo)->exists();

        $debtorNo = (int) ($header['debtor_no'] ?? 0);
        $orderTotal = (float) ($header['total'] ?? 0);
        $transType = (int) ($header['trans_type'] ?? 30);
        // FA: quotations (32) do not consume credit limit.
        if ($debtorNo > 0 && $orderTotal > 0 && $transType !== 32) {
            try {
                $this->customerCredit->assertCanExtendCredit($debtorNo, $orderTotal);
            } catch (\InvalidArgumentException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

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
                'message' => 'Failed to save sales order.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the next available order_no for a new sales order.
     */
    public function nextOrderNo()
    {
        $max = \DB::table('sales_orders')->max('order_no') ?? 0;
        return response()->json(['order_no' => $max + 1]);
    }
}
