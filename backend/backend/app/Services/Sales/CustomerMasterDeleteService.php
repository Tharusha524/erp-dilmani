<?php

namespace App\Services\Sales;

use App\Models\CrmContact;
use App\Models\CrmPersons;
use App\Models\CustAllocation;
use App\Models\CustomerBranch;
use App\Models\DebtorTrans;
use App\Models\DebtorsMaster;
use App\Models\Quotation;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerMasterDeleteService
{
    /** @var list<int> */
    private const CUSTOMER_CATEGORY_IDS = [5, 6, 7, 8];

    /** @var list<int> */
    private const BRANCH_CATEGORY_IDS = [1, 2, 3, 4];

    public function delete(int $debtorNo): void
    {
        $customer = DebtorsMaster::find($debtorNo);
        if (! $customer) {
            throw ValidationException::withMessages([
                'customer' => ['Customer not found.'],
            ]);
        }

        $blockers = $this->blockingReferences($debtorNo);
        if ($blockers !== []) {
            throw ValidationException::withMessages([
                'customer' => [
                    'This customer cannot be deleted because they have '
                    .implode(', ', $blockers)
                    .'. Mark the customer as inactive instead.',
                ],
            ]);
        }

        DB::transaction(function () use ($customer, $debtorNo) {
            $this->deleteCustomerCrmData($customer, $debtorNo);
            $customer->delete();
        });
    }

    /**
     * @return list<string>
     */
    private function blockingReferences(int $debtorNo): array
    {
        $blockers = [];

        if (DebtorTrans::where('debtor_no', $debtorNo)->exists()) {
            $blockers[] = 'sales invoices or payments';
        }
        if (SalesOrder::where('debtor_no', $debtorNo)->exists()) {
            $blockers[] = 'sales orders';
        }
        if (Quotation::where('debtor_no', $debtorNo)->exists()) {
            $blockers[] = 'quotations';
        }
        if (CustAllocation::where('person_id', $debtorNo)->exists()) {
            $blockers[] = 'payment allocations';
        }

        return $blockers;
    }

    private function deleteCustomerCrmData(DebtorsMaster $customer, int $debtorNo): void
    {
        $branchCodes = CustomerBranch::where('debtor_no', $debtorNo)
            ->pluck('branch_code')
            ->map(fn ($code) => (string) $code);

        $entityIds = collect([(string) $debtorNo])->merge($branchCodes)->unique()->values();

        $contacts = CrmContact::query()
            ->whereIn('entity_id', $entityIds)
            ->whereIn('type', array_merge(self::CUSTOMER_CATEGORY_IDS, self::BRANCH_CATEGORY_IDS))
            ->get();

        if ($contacts->isNotEmpty()) {
            CrmContact::whereIn('id', $contacts->pluck('id'))->delete();
        }

        $ref = trim((string) $customer->debtor_ref);
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
