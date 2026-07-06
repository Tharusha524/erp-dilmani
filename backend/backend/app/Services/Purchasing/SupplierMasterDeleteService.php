<?php

namespace App\Services\Purchasing;

use App\Models\CrmContact;
use App\Models\CrmPersons;
use App\Models\GrnBatch;
use App\Models\PurchData;
use App\Models\PurchOrder;
use App\Models\PurchasingPricing;
use App\Models\SuppAllocation;
use App\Models\SuppTrans;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierMasterDeleteService
{
    /** @var list<int> */
    private const SUPPLIER_CATEGORY_IDS = [9, 10, 11, 12];

    public function delete(int $supplierId): void
    {
        $supplier = Supplier::find($supplierId);
        if (! $supplier) {
            throw ValidationException::withMessages([
                'supplier' => ['Supplier not found.'],
            ]);
        }

        $blockers = $this->blockingReferences($supplierId);
        if ($blockers !== []) {
            throw ValidationException::withMessages([
                'supplier' => [
                    'This supplier cannot be deleted because they have '
                    .implode(', ', $blockers)
                    .'. Mark the supplier as inactive instead.',
                ],
            ]);
        }

        DB::transaction(function () use ($supplier, $supplierId) {
            PurchasingPricing::where('supplier_id', $supplierId)->delete();
            PurchData::where('supplier_id', $supplierId)->delete();
            $this->deleteSupplierCrmData($supplier);
            $supplier->delete();
        });
    }

    /**
     * @return list<string>
     */
    private function blockingReferences(int $supplierId): array
    {
        $blockers = [];

        if (GrnBatch::where('supplier_id', $supplierId)->exists()) {
            $blockers[] = 'goods receipts (GRN)';
        }
        if (SuppTrans::where('supplier_id', $supplierId)->exists()) {
            $blockers[] = 'supplier invoices or payments';
        }
        if (PurchOrder::where('supplier_id', $supplierId)->exists()) {
            $blockers[] = 'purchase orders';
        }
        if (SuppAllocation::where('person_id', $supplierId)->exists()) {
            $blockers[] = 'payment allocations';
        }

        return $blockers;
    }

    private function deleteSupplierCrmData(Supplier $supplier): void
    {
        $entityId = (string) $supplier->supplier_id;
        $contacts = CrmContact::query()
            ->where('entity_id', $entityId)
            ->whereIn('type', self::SUPPLIER_CATEGORY_IDS)
            ->get();

        if ($contacts->isNotEmpty()) {
            CrmContact::whereIn('id', $contacts->pluck('id'))->delete();
        }

        $ref = trim((string) $supplier->supp_short_name);
        if ($ref === '') {
            return;
        }

        CrmPersons::where('ref', $ref)->get()->each(function (CrmPersons $person) {
            if (! CrmContact::where('person_id', $person->id)->exists()) {
                $person->delete();
            }
        });
    }
}
