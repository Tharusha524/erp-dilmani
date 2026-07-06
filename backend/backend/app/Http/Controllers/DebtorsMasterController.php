<?php

namespace App\Http\Controllers;

use App\Http\Requests\DebtorsMasterRequest;
use App\Repositories\All\DebtorsMaster\DebtorsMasterInterface;
use App\Services\Sales\CustomerCreditService;
use App\Services\Sales\CustomerMasterDeleteService;
use App\Models\DebtorsMaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DebtorsMasterController extends Controller
{
    private DebtorsMasterInterface $debtorRepo;

    public function __construct(
        DebtorsMasterInterface $debtorRepo,
        private CustomerCreditService $customerCredit,
        private CustomerMasterDeleteService $customerMasterDelete
    ) {
        $this->debtorRepo = $debtorRepo;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DebtorsMaster::query()
            ->with(['currency', 'salesType', 'creditStatus', 'paymentTerm'])
            ->orderByDesc('debtor_no');

        return $this->jsonList($request, $query);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DebtorsMasterRequest $request)
    {
        $debtor = $this->debtorRepo->create($request->validated());
        return response()->json($debtor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $debtor = $this->debtorRepo->find($id);
        if (!$debtor) {
            return response()->json(['message' => 'Debtor not found'], 404);
        }
        return response()->json($debtor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DebtorsMasterRequest $request, string $id)
    {
        $updated = $this->debtorRepo->update($id, $request->validated());
        if (!$updated) {
            return response()->json(['message' => 'Debtor not found'], 404);
        }
        return response()->json($this->debtorRepo->find($id));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->customerMasterDelete->delete((int) $id);

        return response()->json(['message' => 'Debtor deleted']);
    }

    public function creditSummary(string $debtorNo): JsonResponse
    {
        $id = (int) $debtorNo;
        if ($id <= 0) {
            return response()->json(['message' => 'Invalid customer'], 422);
        }

        return response()->json($this->customerCredit->summary($id));
    }
}
