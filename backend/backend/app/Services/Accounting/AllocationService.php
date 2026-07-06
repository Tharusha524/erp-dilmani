<?php

namespace App\Services\Accounting;

use App\Support\AccountingMoney;
use App\Models\CustAllocation;
use App\Models\DebtorTrans;
use App\Models\SuppAllocation;
use App\Models\SuppTrans;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class AllocationService
{
    /** Customer payment / credit note → sales invoice */
    private const CUST_FROM_TYPES = [11, 12];

    /** Customer payment / credit note → sales invoices and delivery notes. */
    private const CUST_TO_TYPES = [10, 13];

    /** Prepaid sales orders accept payment allocations (FA get_allocatable_sales_orders). */
    private const PREPAID_ORDER_TYPE = 30;

    /** Supplier payment / credit → supplier invoice */
    private const SUPP_FROM_TYPES = [21, 22];

    private const SUPP_TO_TYPES = [20];

    /**
     * @return array{from: array, targets: array<int, array>}
     */
    public function customerOpenItems(int $transNo, int $transType): array
    {
        $transType = (int) $transType;
        $from = $this->findDebtorTrans($transNo, $transType);
        if (!$this->isCustomerFromType($transType)) {
            throw new InvalidArgumentException(
                'Only customer payments (type 12) or credit notes (type 11) can be allocated. '.
                'Select a payment/credit row, not an invoice.'
            );
        }

        $fromTotal = $this->debtorTransTotal($from);
        $fromLeft = AccountingMoney::leftToAllocate(
            AccountingMoney::of($fromTotal),
            AccountingMoney::of((float) $from->alloc)
        );

        $targets = DebtorTrans::query()
            ->where('debtor_no', $from->debtor_no)
            ->whereIn('trans_type', self::CUST_TO_TYPES)
            ->orderBy('tran_date')
            ->orderBy('trans_no')
            ->orderByDesc('id')
            ->get()
            ->unique(fn (DebtorTrans $t) => "{$t->trans_type}-{$t->trans_no}")
            ->map(fn (DebtorTrans $t) => $this->mapDebtorTargetRow($t))
            ->filter(fn (array $row) => $row['left_to_allocate'] > 0.001)
            ->values()
            ->all();

        $prepaidTargets = $transType === 12
            ? $this->prepaidOrderTargets((int) $from->debtor_no)
            : [];

        return [
            'from' => $this->mapDebtorFromRow($from, $fromTotal, $fromLeft),
            'targets' => array_values(array_merge($targets, $prepaidTargets)),
            'target_scope' => 'invoices_and_deliveries',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function prepaidOrderTargets(int $debtorNo): array
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('sales_orders')) {
            return [];
        }

        return DB::table('sales_orders')
            ->where('debtor_no', $debtorNo)
            ->where('trans_type', self::PREPAID_ORDER_TYPE)
            ->where('prep_amount', '>', 0)
            ->orderBy('ord_date')
            ->orderBy('order_no')
            ->get()
            ->filter(fn ($order) => ! $this->prepaidOrderHasOpenInvoice($debtorNo, (int) $order->order_no))
            ->map(function ($order) {
                $prep = (float) ($order->prep_amount ?? 0);
                $allocated = (float) ($order->alloc ?? 0);
                $left = round(max(0, $prep - $allocated), 2);

                return [
                    'trans_no' => (int) $order->order_no,
                    'trans_type' => self::PREPAID_ORDER_TYPE,
                    'type_name' => 'Prepaid Sales Order',
                    'reference' => (string) ($order->reference ?? ''),
                    'tran_date' => $order->ord_date,
                    'due_date' => $order->delivery_date,
                    'amount' => round($prep, 2),
                    'other_allocations' => round($allocated, 2),
                    'left_to_allocate' => $left,
                ];
            })
            ->filter(fn (array $row) => $row['left_to_allocate'] > 0.001)
            ->values()
            ->all();
    }

    /**
     * @return array{from: array, targets: array<int, array>}
     */
    public function supplierOpenItems(int $transNo, int $transType): array
    {
        $transType = (int) $transType;
        $from = $this->findSuppTrans($transNo, $transType);
        if (!$this->isSupplierFromType($transType)) {
            throw new InvalidArgumentException(
                'Only supplier payments (type 22) or credit notes (type 21) can be allocated.'
            );
        }

        $fromTotal = $this->suppTransTotal($from);
        $fromLeft = $this->suppFromLeft($from, $fromTotal);

        $targets = SuppTrans::query()
            ->where('supplier_id', $from->supplier_id)
            ->whereIn('trans_type', self::SUPP_TO_TYPES)
            ->orderBy('trans_date')
            ->orderBy('trans_no')
            ->get()
            ->map(fn (SuppTrans $t) => $this->mapSuppTargetRow($t))
            ->filter(fn (array $row) => $row['left_to_allocate'] > 0.001)
            ->values()
            ->all();

        return [
            'from' => $this->mapSuppFromRow($from, $fromTotal, $fromLeft),
            'targets' => $targets,
        ];
    }

    /**
     * @param  array<int, array{trans_no_to:int,trans_type_to:int,amt:float}>  $lines
     */
    public function processCustomerAllocations(
        int $transNoFrom,
        int $transTypeFrom,
        string $dateAlloc,
        array $lines
    ): array {
        $transTypeFrom = (int) $transTypeFrom;
        if (!$this->isCustomerFromType($transTypeFrom)) {
            throw new InvalidArgumentException(
                'Only customer payments (type 12) or credit notes (type 11) can be allocated from.'
            );
        }

        return DB::transaction(function () use ($transNoFrom, $transTypeFrom, $dateAlloc, $lines) {
            $from = $this->findDebtorTrans($transNoFrom, $transTypeFrom);
            $fromLeft = round(abs($this->debtorTransTotal($from)) - abs((float) $from->alloc), 2);
            $totalNew = round(array_sum(array_column($lines, 'amt')), 2);

            if ($totalNew <= 0) {
                throw new InvalidArgumentException('Enter at least one allocation amount.');
            }
            if ($totalNew > $fromLeft + 0.01) {
                throw new InvalidArgumentException('Total allocation exceeds amount left on payment/credit.');
            }

            foreach ($lines as $line) {
                $amt = round((float) $line['amt'], 2);
                if ($amt <= 0) {
                    continue;
                }

                $toType = (int) $line['trans_type_to'];
                $toNo = (int) $line['trans_no_to'];

                if ($toType === self::PREPAID_ORDER_TYPE) {
                    if ($transTypeFrom !== 12) {
                        throw new InvalidArgumentException('Only customer payments can be allocated to prepaid orders.');
                    }
                    $this->allocateToPrepaidOrder($from, $toNo, $amt, $dateAlloc, $transNoFrom, $transTypeFrom);
                    $from->alloc = round((float) $from->alloc + $amt, 2);
                    $from->save();
                    continue;
                }

                $to = $this->findDebtorTrans($toNo, $toType);
                $allowedToTypes = $transTypeFrom === 12
                    ? array_merge(self::CUST_TO_TYPES, [self::PREPAID_ORDER_TYPE])
                    : self::CUST_TO_TYPES;

                if (! in_array($toType, $allowedToTypes, true)) {
                    throw new InvalidArgumentException(
                        $transTypeFrom === 12
                            ? 'Allocations can only be applied to sales invoices (type 10), delivery notes (type 13), or prepaid orders (type 30).'
                            : 'Credit notes can only be allocated to open sales invoices (type 10) or delivery notes (type 13).'
                    );
                }
                $toLeft = round(max(0, abs($this->debtorTransTotal($to)) - $this->debtorToAllocated($to)), 2);
                if ($amt > $toLeft + 0.01) {
                    throw new InvalidArgumentException(
                        "Allocation exceeds balance on {$this->customerTargetTypeName($toType)} #{$to->trans_no}."
                    );
                }

                CustAllocation::create([
                    'person_id' => $from->debtor_no,
                    'amt' => $amt,
                    'date_alloc' => $dateAlloc,
                    'trans_no_from' => $transNoFrom,
                    'trans_type_from' => $transTypeFrom,
                    'trans_no_to' => $to->trans_no,
                    'trans_type_to' => $to->trans_type,
                ]);

                $from->alloc = round((float) $from->alloc + $amt, 2);
                $to->alloc = round((float) $to->alloc + $amt, 2);
                $from->save();
                $to->save();
            }

            return ['message' => 'Customer allocations saved.', 'allocated' => $totalNew];
        });
    }

    /**
     * @param  array<int, array{trans_no_to:int,trans_type_to:int,amt:float}>  $lines
     */
    public function processSupplierAllocations(
        int $transNoFrom,
        int $transTypeFrom,
        string $dateAlloc,
        array $lines
    ): array {
        $transTypeFrom = (int) $transTypeFrom;
        if (!$this->isSupplierFromType($transTypeFrom)) {
            throw new InvalidArgumentException(
                'Only supplier payments (type 22) or credit notes (type 21) can be allocated from.'
            );
        }

        return DB::transaction(function () use ($transNoFrom, $transTypeFrom, $dateAlloc, $lines) {
            $from = $this->findSuppTrans($transNoFrom, $transTypeFrom);
            $fromLeft = $this->suppFromLeft($from, $this->suppTransTotal($from));
            $totalNew = round(array_sum(array_column($lines, 'amt')), 2);

            if ($totalNew <= 0) {
                throw new InvalidArgumentException('Enter at least one allocation amount.');
            }
            if ($totalNew > $fromLeft + 0.01) {
                throw new InvalidArgumentException('Total allocation exceeds amount left on payment/credit.');
            }

            foreach ($lines as $line) {
                $amt = round((float) $line['amt'], 2);
                if ($amt <= 0) {
                    continue;
                }

                $to = $this->findSuppTrans((int) $line['trans_no_to'], (int) $line['trans_type_to']);
                $toTotal = $this->suppTransTotal($to);
                $toLeft = round($toTotal - $this->suppToAllocated($to), 2);
                if ($amt > $toLeft + 0.01) {
                    throw new InvalidArgumentException("Allocation exceeds balance on invoice #{$to->trans_no}.");
                }

                SuppAllocation::create([
                    'person_id' => $from->supplier_id,
                    'amount' => $amt,
                    'date_alloc' => $dateAlloc,
                    'trans_no_from' => $transNoFrom,
                    'trans_type_from' => $transTypeFrom,
                    'trans_no_to' => $to->trans_no,
                    'trans_type_to' => $to->trans_type,
                ]);

                $from->alloc = round((float) $from->alloc + $amt, 2);
                $to->alloc = round((float) $to->alloc + $amt, 2);
                $from->save();
                $to->save();
            }

            return ['message' => 'Supplier allocations saved.', 'allocated' => $totalNew];
        });
    }

    public function voidSupplierDocumentAllocations(int $transNo, int $transType): void
    {
        if (! Schema::hasTable('supp_allocations')) {
            return;
        }

        $rows = SuppAllocation::query()
            ->where(function ($q) use ($transNo, $transType) {
                $q->where(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_from', $transNo)->where('trans_type_from', $transType);
                })->orWhere(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_to', $transNo)->where('trans_type_to', $transType);
                });
            })
            ->get();

        foreach ($rows as $row) {
            $amount = round((float) $row->amount, 2);
            if ($amount < 0.001) {
                continue;
            }

            $from = $this->findSuppTrans((int) $row->trans_no_from, (int) $row->trans_type_from);
            $to = $this->findSuppTrans((int) $row->trans_no_to, (int) $row->trans_type_to);
            $from->alloc = round(max(0, (float) $from->alloc - $amount), 2);
            $to->alloc = round(max(0, (float) $to->alloc - $amount), 2);
            $from->save();
            $to->save();
        }

        SuppAllocation::query()
            ->where(function ($q) use ($transNo, $transType) {
                $q->where(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_from', $transNo)->where('trans_type_from', $transType);
                })->orWhere(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_to', $transNo)->where('trans_type_to', $transType);
                });
            })
            ->delete();
    }

    public function voidCustomerDocumentAllocations(int $transNo, int $transType): void
    {
        if (! Schema::hasTable('cust_allocations')) {
            return;
        }

        $rows = CustAllocation::query()
            ->where(function ($q) use ($transNo, $transType) {
                $q->where(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_from', $transNo)->where('trans_type_from', $transType);
                })->orWhere(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_to', $transNo)->where('trans_type_to', $transType);
                });
            })
            ->get();

        foreach ($rows as $row) {
            $amount = round((float) $row->amt, 2);
            if ($amount < 0.001) {
                continue;
            }

            if (in_array((int) $row->trans_type_from, self::CUST_FROM_TYPES, true)) {
                try {
                    $from = $this->findDebtorTrans((int) $row->trans_no_from, (int) $row->trans_type_from);
                    $from->alloc = round(max(0, (float) $from->alloc - $amount), 2);
                    $from->save();
                } catch (InvalidArgumentException) {
                }
            }

            $toType = (int) $row->trans_type_to;
            $toNo = (int) $row->trans_no_to;

            if ($toType === self::PREPAID_ORDER_TYPE) {
                $order = DB::table('sales_orders')->where('order_no', $toNo)->first();
                if ($order) {
                    DB::table('sales_orders')->where('order_no', $toNo)->update([
                        'alloc' => round(max(0, (float) ($order->alloc ?? 0) - $amount), 2),
                        'updated_at' => now(),
                    ]);
                }
            } elseif (in_array($toType, self::CUST_TO_TYPES, true)) {
                try {
                    $to = $this->findDebtorTrans($toNo, $toType);
                    $to->alloc = round(max(0, (float) $to->alloc - $amount), 2);
                    $to->save();
                } catch (InvalidArgumentException) {
                }
            }
        }

        CustAllocation::query()
            ->where(function ($q) use ($transNo, $transType) {
                $q->where(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_from', $transNo)->where('trans_type_from', $transType);
                })->orWhere(function ($q2) use ($transNo, $transType) {
                    $q2->where('trans_no_to', $transNo)->where('trans_type_to', $transType);
                });
            })
            ->delete();
    }

    private function allocateToPrepaidOrder(
        DebtorTrans $from,
        int $orderNo,
        float $amt,
        string $dateAlloc,
        int $transNoFrom,
        int $transTypeFrom
    ): void {
        $order = DB::table('sales_orders')->where('order_no', $orderNo)->first();
        if (! $order) {
            throw new InvalidArgumentException("Prepaid sales order #{$orderNo} not found.");
        }
        if ((int) ($order->debtor_no ?? 0) !== (int) $from->debtor_no) {
            throw new InvalidArgumentException('Prepaid order belongs to a different customer.');
        }

        if ($this->prepaidOrderHasOpenInvoice((int) $from->debtor_no, $orderNo)) {
            throw new InvalidArgumentException(
                "Sales order #{$orderNo} already has an open invoice. Allocate this payment to the invoice instead."
            );
        }

        $prep = (float) ($order->prep_amount ?? 0);
        $allocated = (float) ($order->alloc ?? 0);
        $left = round(max(0, $prep - $allocated), 2);
        if ($amt > $left + 0.01) {
            throw new InvalidArgumentException("Allocation exceeds prepaid balance on order #{$orderNo}.");
        }

        CustAllocation::create([
            'person_id' => $from->debtor_no,
            'amt' => $amt,
            'date_alloc' => $dateAlloc,
            'trans_no_from' => $transNoFrom,
            'trans_type_from' => $transTypeFrom,
            'trans_no_to' => $orderNo,
            'trans_type_to' => self::PREPAID_ORDER_TYPE,
        ]);

        DB::table('sales_orders')->where('order_no', $orderNo)->update([
            'alloc' => round($allocated + $amt, 2),
            'updated_at' => now(),
        ]);
    }

    private function isCustomerFromType(int $transType): bool
    {
        return in_array($transType, self::CUST_FROM_TYPES, true);
    }

    private function customerTargetTypeName(int $transType): string
    {
        return match ($transType) {
            10 => 'Sales Invoice',
            13 => 'Delivery Note',
            30 => 'Prepaid Sales Order',
            default => 'Customer Transaction',
        };
    }

    private function isSupplierFromType(int $transType): bool
    {
        return in_array($transType, self::SUPP_FROM_TYPES, true);
    }

    private function findDebtorTrans(int $transNo, int $transType): DebtorTrans
    {
        $row = DebtorTrans::query()
            ->where('trans_no', $transNo)
            ->where('trans_type', $transType)
            ->orderByDesc('id')
            ->first();

        if (!$row) {
            throw new InvalidArgumentException('Customer transaction not found.');
        }

        return $row;
    }

    private function findSuppTrans(int $transNo, int $transType): SuppTrans
    {
        $row = SuppTrans::query()
            ->where('trans_no', $transNo)
            ->where('trans_type', $transType)
            ->first();

        if (!$row) {
            throw new InvalidArgumentException('Supplier transaction not found.');
        }

        return $row;
    }

    private function debtorTransTotal(DebtorTrans $t): float
    {
        return AccountingMoney::toDecimal(AccountingMoney::sum([
            $t->ov_amount,
            $t->ov_gst,
            $t->ov_freight,
            $t->ov_freight_tax,
            $t->ov_discount,
        ]));
    }

    private function prepaidOrderHasOpenInvoice(int $debtorNo, int $orderNo): bool
    {
        return DebtorTrans::query()
            ->where('debtor_no', $debtorNo)
            ->where('order_no', $orderNo)
            ->where('trans_type', 10)
            ->get()
            ->contains(function (DebtorTrans $invoice) {
                $total = abs($this->debtorTransTotal($invoice));
                $left = round(max(0, $total - $this->debtorToAllocated($invoice)), 2);

                return $left > 0.001;
            });
    }

    private function suppTransTotal(SuppTrans $t): float
    {
        return (float) $t->ov_amount
            + (float) ($t->ov_gst ?? 0)
            - (float) ($t->ov_discount ?? 0);
    }

    private function otherCustAlloc(int $transNo, int $transType): float
    {
        return (float) CustAllocation::query()
            ->where('trans_no_to', $transNo)
            ->where('trans_type_to', $transType)
            ->sum('amt');
    }

    private function otherSuppAlloc(int $transNo, int $transType): float
    {
        return (float) SuppAllocation::query()
            ->where('trans_no_to', $transNo)
            ->where('trans_type_to', $transType)
            ->sum('amount');
    }

    private function mapDebtorFromRow(DebtorTrans $t, float $total, float $left): array
    {
        return [
            'trans_no' => $t->trans_no,
            'trans_type' => $t->trans_type,
            'debtor_no' => $t->debtor_no,
            'reference' => $t->reference,
            'tran_date' => $t->tran_date,
            'total' => round($total, 2),
            'allocated' => round((float) $t->alloc, 2),
            'left_to_allocate' => max(0, $left),
        ];
    }

    private function debtorToAllocated(DebtorTrans $t): float
    {
        $fromColumn = round(abs((float) $t->alloc), 2);
        if (Schema::hasTable('cust_allocations')) {
            $fromTable = round($this->otherCustAlloc($t->trans_no, $t->trans_type), 2);

            return max($fromColumn, $fromTable);
        }

        return $fromColumn;
    }

    private function mapDebtorTargetRow(DebtorTrans $t): array
    {
        $total = round(abs($this->debtorTransTotal($t)), 2);
        $allocated = $this->debtorToAllocated($t);
        $left = round(max(0, $total - $allocated), 2);

        if ((int) $t->trans_type === 13) {
            $left = $this->deliveryLeftAfterInvoicing($t, $total, $left);
        }

        return [
            'trans_no' => $t->trans_no,
            'trans_type' => $t->trans_type,
            'type_name' => $this->customerTargetTypeName((int) $t->trans_type),
            'reference' => $t->reference,
            'tran_date' => $t->tran_date,
            'due_date' => $t->due_date,
            'amount' => $total,
            'other_allocations' => $allocated,
            'left_to_allocate' => $left,
        ];
    }

    private function mapSuppFromRow(SuppTrans $t, float $total, float $left): array
    {
        return [
            'trans_no' => $t->trans_no,
            'trans_type' => $t->trans_type,
            'supplier_id' => $t->supplier_id,
            'reference' => $t->reference,
            'supp_reference' => $t->supp_reference,
            'trans_date' => $t->trans_date,
            'total' => round($total, 2),
            'allocated' => round($this->suppFromAllocated($t), 2),
            'left_to_allocate' => max(0, $left),
        ];
    }

    private function mapSuppTargetRow(SuppTrans $t): array
    {
        $total = $this->suppTransTotal($t);
        $allocated = $this->suppToAllocated($t);
        $left = round($total - $allocated, 2);

        return [
            'trans_no' => $t->trans_no,
            'trans_type' => $t->trans_type,
            'type_name' => 'Supplier Invoice',
            'reference' => $t->reference,
            'supp_reference' => $t->supp_reference,
            'trans_date' => $t->trans_date,
            'due_date' => $t->due_date,
            'amount' => round($total, 2),
            'other_allocations' => round($allocated, 2),
            'left_to_allocate' => max(0, $left),
        ];
    }

    private function suppFromLeft(SuppTrans $t, float $total): float
    {
        return max(0, round(abs($total) - $this->suppFromAllocated($t), 2));
    }

    private function suppFromAllocated(SuppTrans $t): float
    {
        if (Schema::hasTable('supp_allocations')) {
            return round((float) SuppAllocation::query()
                ->where('trans_no_from', $t->trans_no)
                ->where('trans_type_from', $t->trans_type)
                ->sum('amount'), 2);
        }

        return round(abs((float) $t->alloc), 2);
    }

    private function suppToAllocated(SuppTrans $t): float
    {
        if (Schema::hasTable('supp_allocations')) {
            return round($this->otherSuppAlloc($t->trans_no, $t->trans_type), 2);
        }

        return round((float) $t->alloc, 2);
    }

    /**
     * Delivery notes that were invoiced and fully paid should not appear as open targets.
     */
    private function deliveryLeftAfterInvoicing(DebtorTrans $delivery, float $total, float $left): float
    {
        if ($left <= 0.001) {
            return 0;
        }

        $detailIds = DB::table('debtor_trans_details')
            ->where('debtor_trans_type', 13)
            ->where('debtor_trans_no', $delivery->trans_no)
            ->pluck('id');

        if ($detailIds->isEmpty()) {
            return $left;
        }

        $invoiceNos = DB::table('debtor_trans_details')
            ->where('debtor_trans_type', 10)
            ->whereIn('src_id', $detailIds)
            ->pluck('debtor_trans_no')
            ->unique()
            ->values();

        if ($invoiceNos->isEmpty()) {
            return $left;
        }

        $openInvoiceBalance = 0.0;
        foreach ($invoiceNos as $invoiceNo) {
            $invoice = DebtorTrans::query()
                ->where('trans_type', 10)
                ->where('trans_no', $invoiceNo)
                ->orderByDesc('id')
                ->first();

            if (! $invoice) {
                continue;
            }

            $invoiceTotal = round(abs($this->debtorTransTotal($invoice)), 2);
            $invoiceLeft = round(max(0, $invoiceTotal - $this->debtorToAllocated($invoice)), 2);
            if ($invoiceLeft > 0.001) {
                return 0;
            }

            $openInvoiceBalance += $invoiceTotal;
        }

        if ($openInvoiceBalance + 0.01 >= $total) {
            return 0;
        }

        return $left;
    }
}
