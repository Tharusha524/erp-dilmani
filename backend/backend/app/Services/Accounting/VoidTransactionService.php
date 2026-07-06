<?php

namespace App\Services\Accounting;

use App\Models\BankTrans;
use App\Models\DebtorTrans;
use App\Models\GlTrans;
use App\Models\SuppTrans;
use App\Support\AuditTrailRecorder;
use App\Support\GlTransHelper;
use App\Services\Manufacturing\ManufacturingPostingService;
use App\Services\Purchasing\GrnReceiptService;
use App\Services\Purchasing\SupplierCreditNoteService;
use App\Services\Purchasing\SupplierInvoiceService;
use App\Services\Purchasing\SupplierPaymentService;
use App\Services\Sales\SalesDeliveryService;
use App\Services\Sales\SalesInvoiceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class VoidTransactionService
{
    public function __construct(
        private SalesDeliveryService $deliveryService,
        private SalesInvoiceService $invoiceService,
        private SupplierInvoiceService $supplierInvoiceService,
        private SupplierCreditNoteService $supplierCreditNoteService,
        private SupplierPaymentService $supplierPaymentService,
        private GrnReceiptService $grnReceiptService,
        private ManufacturingPostingService $manufacturingPostingService,
    ) {}
    /** @var array<int, string> */
    private const TYPE_LABELS = [
        0 => 'Journal Entry',
        1 => 'Bank Payment',
        2 => 'Bank Deposit',
        4 => 'Funds Transfer',
        10 => 'Sales Invoice',
        11 => 'Customer Credit Note',
        12 => 'Customer Payment',
        13 => 'Delivery Note',
        20 => 'Supplier Invoice',
        21 => 'Supplier Credit Note',
        22 => 'Supplier Payment',
        25 => 'Supplier Delivery (GRN)',
        26 => 'Work Order Close',
        28 => 'Work Order Issue',
        29 => 'Work Order Production',
    ];

    /**
     * @return array<int, array{trans_type:int,trans_no:int,label:string,type_name:string,reference:string,date:?string}>
     */
    public function listRecent(int $limit = 100): array
    {
        $items = [];
        $seen = [];

        $push = function (array $row) use (&$items, &$seen): void {
            $ref = (string) ($row['reference'] ?? '');
            if (str_contains($ref, '[VOIDED]')) {
                return;
            }

            $key = $row['trans_type'].':'.$row['trans_no'];
            if (isset($seen[$key])) {
                return;
            }
            $seen[$key] = true;

            $type = (int) $row['trans_type'];
            $row['type_name'] = self::TYPE_LABELS[$type] ?? "Type {$type}";
            $row['label'] = $row['type_name'].' #'.$row['trans_no'];
            $items[] = $row;
        };

        foreach (DebtorTrans::query()->orderByDesc('tran_date')->limit($limit)->get() as $t) {
            $push([
                'trans_type' => (int) $t->trans_type,
                'trans_no' => (int) $t->trans_no,
                'reference' => $t->reference,
                'date' => $t->tran_date,
            ]);
        }

        foreach (SuppTrans::query()->orderByDesc('trans_date')->limit($limit)->get() as $t) {
            $push([
                'trans_type' => (int) $t->trans_type,
                'trans_no' => (int) $t->trans_no,
                'reference' => $t->reference,
                'date' => $t->trans_date,
            ]);
        }

        if (Schema::hasTable('grn_batch')) {
            foreach (DB::table('grn_batch')->orderByDesc('delivery_date')->limit($limit)->get() as $g) {
                $ref = (string) ($g->reference ?? '');
                $push([
                    'trans_type' => 25,
                    'trans_no' => (int) $g->id,
                    'reference' => $ref,
                    'date' => $g->delivery_date ?? null,
                ]);
            }
        }

        if (Schema::hasTable('journal')) {
            foreach (DB::table('journal')->orderByDesc('tran_date')->limit($limit)->get() as $j) {
                $push([
                    'trans_type' => (int) $j->type,
                    'trans_no' => (int) $j->trans_no,
                    'reference' => $j->reference ?? '',
                    'date' => $j->tran_date ?? null,
                ]);
            }
        }

        foreach (
            BankTrans::query()
                ->select('type', 'trans_no', 'ref', 'trans_date')
                ->orderByDesc('trans_date')
                ->limit($limit * 2)
                ->get()
                ->unique(fn ($t) => $t->type.':'.$t->trans_no)
            as $t
        ) {
            $push([
                'trans_type' => (int) $t->type,
                'trans_no' => (int) $t->trans_no,
                'reference' => $t->ref ?? '',
                'date' => $t->trans_date,
            ]);
        }

        usort($items, fn ($a, $b) => strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? '')));

        return array_slice($items, 0, $limit);
    }

    public function void(int $transType, int $transNo, string $voidDate, ?string $memo = null): array
    {
        if ($transType === 13) {
            return $this->deliveryService->void($transNo, $memo);
        }

        if ($transType === 10) {
            return $this->invoiceService->void($transNo, $memo);
        }

        if ($transType === 20) {
            return $this->supplierInvoiceService->void($transNo, $memo);
        }

        if ($transType === 21) {
            return $this->supplierCreditNoteService->void($transNo, $memo);
        }

        if ($transType === 22) {
            return $this->supplierPaymentService->void($transNo, $memo);
        }

        if ($transType === 25) {
            return $this->grnReceiptService->void($transNo, $memo);
        }

        if ($transType === 28) {
            return $this->manufacturingPostingService->voidIssue($transNo, $memo);
        }

        if ($transType === 29) {
            return $this->manufacturingPostingService->voidProduction($transNo, $memo);
        }

        if ($transType === 26) {
            return $this->manufacturingPostingService->voidWorkOrder($transNo, $memo);
        }

        return DB::transaction(function () use ($transType, $transNo, $voidDate, $memo) {
            $query = GlTrans::query()->where('type', (string) $transType);
            if (\Illuminate\Support\Facades\Schema::hasColumn('gl_trans', 'type_no')) {
                $query->where('type_no', $transNo);
            } else {
                $query->where('reference', 'like', '%'.$transNo.'%');
            }
            $glLines = $query->get();

            if ($glLines->isEmpty()) {
                throw new InvalidArgumentException(
                    'No general ledger postings found for this transaction. Only posted GL transactions can be voided.'
                );
            }

            $reversal = [];
            foreach ($glLines as $line) {
                $reversal[] = [
                    'type' => $transType,
                    'type_no' => $transNo,
                    'tran_date' => $voidDate,
                    'date' => $voidDate,
                    'account' => $line->account,
                    'reference' => ($line->reference ?? '').' VOID',
                    'memo' => $memo ? "VOID: {$memo}" : 'VOID',
                    'debit' => (float) ($line->credit ?? 0),
                    'credit' => (float) ($line->debit ?? 0),
                    'cost_center_id' => $line->cost_center_id ?? null,
                ];
            }

            GlTransHelper::insertLines($reversal);

            $this->markSubledgerVoided($transType, $transNo);
            AuditTrailRecorder::markVoided($transType, $transNo, $voidDate, $memo);

            return [
                'message' => 'Transaction voided. Reversing GL entries were posted.',
                'trans_type' => $transType,
                'trans_no' => $transNo,
                'lines_reversed' => count($reversal),
            ];
        });
    }

    private function markSubledgerVoided(int $transType, int $transNo): void
    {
        if (in_array($transType, [10, 11, 12, 13], true)) {
            DebtorTrans::query()
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->update(['reference' => DB::raw("CONCAT(reference, ' [VOIDED]')")]);
        }

        if (in_array($transType, [20, 21, 22], true)) {
            SuppTrans::query()
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->update(['reference' => DB::raw("CONCAT(reference, ' [VOIDED]')")]);
        }

        if ($transType === 25 && Schema::hasTable('grn_batch')) {
            DB::table('grn_batch')
                ->where('id', $transNo)
                ->update(['reference' => DB::raw("CONCAT(COALESCE(reference,''), ' [VOIDED]')")]);
        }

        if (in_array($transType, [0, 1, 2, 4], true)) {
            BankTrans::query()
                ->where('type', $transType)
                ->where('trans_no', $transNo)
                ->update(['ref' => DB::raw("CONCAT(COALESCE(ref,''), ' [VOIDED]')")]);
        }
    }
}
