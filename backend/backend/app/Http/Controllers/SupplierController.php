<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierRequest;
use App\Repositories\All\Supplier\SupplierInterface;
use App\Services\Purchasing\SupplierCreditService;
use App\Services\Purchasing\SupplierMasterDeleteService;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    private SupplierInterface $supplierRepo;

    public function __construct(
        SupplierInterface $supplierRepo,
        private SupplierCreditService $supplierCredit,
        private SupplierMasterDeleteService $supplierMasterDelete
    ) {
        $this->supplierRepo = $supplierRepo;
    }

    public function index(Request $request)
    {
        $query = Supplier::query()
            ->with([
                'currency',
                'taxGroup',
                'paymentTerm',
                'payableAccount',
                'purchaseAccount',
                'paymentDiscountAccount',
            ])
            ->orderByDesc('supplier_id');

        return $this->jsonList($request, $query);
    }

    public function store(SupplierRequest $request)
    {
        $supplier = $this->supplierRepo->create($request->validated());
        return response()->json($supplier, 201);
    }

    public function show($id)
    {
        $supplier = $this->supplierRepo->find($id);

        if (!$supplier) {
            return response()->json(['message' => 'Supplier not found'], 404);
        }

        return response()->json($supplier);
    }

    public function update(SupplierRequest $request, $id)
    {
        $supplier = $this->supplierRepo->update($id, $request->validated());

        if (!$supplier) {
            return response()->json(['message' => 'Supplier not found'], 404);
        }

        return response()->json($supplier);
    }

    public function destroy($id)
    {
        $this->supplierMasterDelete->delete((int) $id);

        return response()->json(['message' => 'Supplier deleted']);
    }

    public function creditSummary(string $supplierId): JsonResponse
    {
        $id = (int) $supplierId;
        if ($id <= 0) {
            return response()->json(['message' => 'Invalid supplier'], 422);
        }

        if (! $this->supplierRepo->find($id)) {
            return response()->json(['message' => 'Supplier not found'], 404);
        }

        return response()->json($this->supplierCredit->summary($id));
    }
}
