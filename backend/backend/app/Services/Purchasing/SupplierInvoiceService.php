<?php

namespace App\Services\Purchasing;

use App\Models\GrnItem;
use App\Models\PurchOrderDetail;
use App\Models\SuppTrans;
use App\Services\Accounting\AllocationService;
use App\Services\Accounting\PostingsService;
use App\Services\FiscalYear\TransactionReferenceService;
use App\Services\FixedAssets\FaDepreciationService;
use App\Support\ActiveFiscalYear;
use App\Support\GlPostingRunner;
use App\Support\GlTransHelper;
use App\Support\PurchaseTaxCalculator;
use App\Support\SuppTransSequence;
use App\Support\SupplierExchangeRate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * FrontAccounting add_supp_invoice() — supplier invoice from GRN or direct.
 */
class SupplierInvoiceService
{
    public const TYPE_INVOICE = 20;

    public function __construct(
        private GrnReceiptService $grnReceipt,
        private TransactionReferenceService $references,
        private PostingsService $postings,
        private SupplierCreditService $supplierCredit,
        private PurchaseTaxCalculator $purchaseTax,
        private AllocationService $allocations,
    ) {}

    /**
     * Invoice GRN lines (single supplier invoice with multiple lines).
     *
     * @param  array{
     *     supplier_id:int,
     *     reference?:string|null,
     *     supp_reference?:string|null,
     *     trans_date:string,
     *     due_date?:string|null,
     *     tax_included?:bool,
     *     comments?:string|null,
     *     lines: array<int, array{grn_item_id:int, quantity:float}>,
     *     gl_lines?: array<int, array{gl_code:string, amount:float, memo?:string|null, dimension_id?:int|null}>
     * }  $payload
     */
    public function invoiceFromGrn(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $supplierId = (int) ($payload['supplier_id'] ?? 0);
            if ($supplierId <= 0) {
                throw new InvalidArgumentException('Supplier is required.');
            }

            $inputLines = $payload['lines'] ?? [];
            $glInputLines = $payload['gl_lines'] ?? [];
            if ($inputLines === [] && $glInputLines === []) {
                throw new InvalidArgumentException('At least one invoice line or GL line is required.');
            }

            $tranDate = (string) ($payload['trans_date'] ?? now()->toDateString());
            $dueDate = (string) ($payload['due_date'] ?? $tranDate);
            $reference = trim((string) ($payload['reference'] ?? ''));
            if ($reference === '') {
                $refData = $this->references->next(self::TYPE_INVOICE, $tranDate);
                $reference = (string) ($refData['reference'] ?? '');
            }

            $transNo = SuppTransSequence::nextTransNo(self::TYPE_INVOICE);
            $invoiceItems = [];
            $taxCalcLines = [];

            foreach ($inputLines as $input) {
                $grnItemId = (int) ($input['grn_item_id'] ?? 0);
                $qty = round((float) ($input['quantity'] ?? 0), 4);
                if ($qty <= 0) {
                    continue;
                }

                $grnItem = GrnItem::query()->find($grnItemId);
                if (! $grnItem) {
                    throw new InvalidArgumentException("GRN item {$grnItemId} not found.");
                }

                $remaining = round((float) $grnItem->qty_recd - (float) $grnItem->quantity_inv, 4);
                if ($qty > $remaining + 0.0001) {
                    $hint = $remaining <= 0.0001
                        ? 'This GRN line has already been fully invoiced.'
                        : "Only {$remaining} remains to invoice on this delivery line.";
                    throw new InvalidArgumentException(
                        "Invoice quantity for {$grnItem->item_code} exceeds uninvoiced GRN quantity. {$hint}"
                    );
                }

                $detail = PurchOrderDetail::query()
                    ->where('po_detail_item', $grnItem->po_detail_item)
                    ->first();

                $unitPrice = (float) ($detail->unit_price ?? $detail->act_price ?? 0);
                $discountPercent = Schema::hasColumn('purch_order_details', 'discount_percent')
                    ? (float) ($detail->discount_percent ?? 0)
                    : 0.0;
                $taxCalcLines[] = [
                    'stock_id' => (string) $grnItem->item_code,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'discount_percent' => $discountPercent,
                ];

                $grnItem->update([
                    'quantity_inv' => round((float) $grnItem->quantity_inv + $qty, 4),
                ]);

                if ($detail) {
                    $detail->update([
                        'qty_invoiced' => round((float) $detail->qty_invoiced + $qty, 4),
                    ]);
                }

                $invoiceItems[] = [
                    'supp_trans_no' => $transNo,
                    'supp_trans_type' => self::TYPE_INVOICE,
                    'gl_code' => '0',
                    'grn_item_id' => $grnItemId,
                    'po_detail_item_id' => $grnItem->po_detail_item,
                    'stock_id' => $grnItem->item_code,
                    'description' => $grnItem->description,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'discount_percent' => $discountPercent,
                    'unit_tax' => 0,
                    'memo' => '',
                    'dimension_id' => 0,
                    'dimension2_id' => 0,
                ];
            }

            foreach ($payload['gl_lines'] ?? [] as $glLine) {
                $amount = round((float) ($glLine['amount'] ?? 0), 2);
                $glCode = trim((string) ($glLine['gl_code'] ?? ''));
                if ($glCode === '' || abs($amount) < 0.001) {
                    continue;
                }
                $invoiceItems[] = $this->glInvoiceItemRow(
                    $transNo,
                    self::TYPE_INVOICE,
                    $glCode,
                    $amount,
                    (string) ($glLine['memo'] ?? ''),
                    (int) ($glLine['dimension_id'] ?? 0)
                );
            }

            if ($invoiceItems === []) {
                throw new InvalidArgumentException('No invoice quantities to process.');
            }

            $taxIncluded = (bool) ($payload['tax_included'] ?? false);
            $taxResult = $this->purchaseTax->calculateForSupplier($supplierId, $taxIncluded, $taxCalcLines);
            $ovAmount = (float) $taxResult['ov_amount'];
            $ovGst = (float) $taxResult['ov_gst'];

            $stockLineIdx = 0;
            foreach ($invoiceItems as &$item) {
                if (empty($item['grn_item_id'])) {
                    continue;
                }
                if (isset($taxResult['line_amounts'][$stockLineIdx])) {
                    $item['unit_tax'] = $taxResult['line_amounts'][$stockLineIdx]['unit_tax'];
                }
                $stockLineIdx++;
            }
            unset($item);

            $glLineTotal = 0.0;
            foreach ($invoiceItems as $item) {
                if (empty($item['grn_item_id']) && trim((string) ($item['gl_code'] ?? '')) !== '' && (string) ($item['gl_code'] ?? '') !== '0') {
                    $glLineTotal += round((float) ($item['unit_price'] ?? 0), 2);
                }
            }
            $headerTotal = round($ovAmount + $ovGst + $glLineTotal, 2);

            $this->supplierCredit->assertCanExtendCredit($supplierId, $headerTotal);

            $suppTrans = $this->createSuppTransHeader(
                $transNo,
                $supplierId,
                $reference,
                (string) ($payload['supp_reference'] ?? ''),
                $tranDate,
                $dueDate,
                $ovAmount + $glLineTotal,
                $ovGst,
                $taxIncluded
            );

            foreach ($invoiceItems as $item) {
                DB::table('supp_invoice_items')->insert(array_merge($item, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            $glWarning = $this->postInvoiceGl($suppTrans);
            $this->addComment(self::TYPE_INVOICE, $transNo, $tranDate, (string) ($payload['comments'] ?? ''));
            $this->addAuditTrail(self::TYPE_INVOICE, $transNo, $tranDate, 'Created');

            $result = [
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_INVOICE,
                'reference' => $reference,
                'supp_trans' => $suppTrans->fresh()->toArray(),
            ];
            if ($glWarning) {
                $result['gl_warning'] = $glWarning;
            }

            return $result;
        });
    }

    /**
     * Direct supplier invoice — PO + GRN + invoice in one transaction.
     *
     * @param  array{
     *     supplier_id:int,
     *     reference?:string|null,
     *     supp_reference?:string|null,
     *     trans_date:string,
     *     due_date?:string|null,
     *     into_stock_location:string,
     *     delivery_address?:string|null,
     *     tax_included?:bool,
     *     comments?:string|null,
     *     fixed_asset?:bool,
     *     lines: array<int, array{item_code:string, description?:string|null, quantity:float, unit_price:float}>
     * }  $payload
     */
    public function directInvoice(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $fixedAsset = (bool) ($payload['fixed_asset'] ?? false);
            $lines = $payload['lines'] ?? [];
            if ($fixedAsset) {
                $this->assertFixedAssetLines($lines);
            }

            $grnResult = $this->grnReceipt->directGrn([
                'supplier_id' => (int) $payload['supplier_id'],
                'reference' => $payload['reference'] ?? null,
                'delivery_date' => $payload['trans_date'] ?? now()->toDateString(),
                'into_stock_location' => $payload['into_stock_location'],
                'delivery_address' => $payload['delivery_address'] ?? '',
                'tax_included' => $payload['tax_included'] ?? false,
                'comments' => $payload['comments'] ?? null,
                'fixed_asset' => $fixedAsset,
                'lines' => $lines,
            ]);

            $grnItemIds = [];
            foreach ($grnResult['items'] as $item) {
                $grnItemIds[] = [
                    'grn_item_id' => (int) ($item['id'] ?? 0),
                    'quantity' => (float) ($item['qty_recd'] ?? 0),
                ];
            }

            $invoiceResult = $this->invoiceFromGrn([
                'supplier_id' => (int) $payload['supplier_id'],
                'reference' => $payload['reference'] ?? $grnResult['reference'] ?? null,
                'supp_reference' => $payload['supp_reference'] ?? '',
                'trans_date' => $payload['trans_date'] ?? now()->toDateString(),
                'due_date' => $payload['due_date'] ?? $payload['trans_date'] ?? now()->toDateString(),
                'tax_included' => $payload['tax_included'] ?? false,
                'comments' => $payload['comments'] ?? null,
                'lines' => $grnItemIds,
            ]);

            return array_merge($invoiceResult, [
                'order_no' => $grnResult['order_no'],
                'grn_batch_id' => $grnResult['grn_batch_id'],
            ]);
        });
    }

    public function void(int $transNo, ?string $memo = null): array
    {
        return DB::transaction(function () use ($transNo) {
            $header = SuppTrans::query()
                ->where('trans_type', self::TYPE_INVOICE)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Supplier invoice not found.');
            }

            if (Schema::hasTable('supp_allocations')) {
                $this->allocations->voidSupplierDocumentAllocations($transNo, self::TYPE_INVOICE);
            }

            if (Schema::hasTable('supp_invoice_items')) {
                $items = DB::table('supp_invoice_items')
                    ->where('supp_trans_no', $transNo)
                    ->where('supp_trans_type', self::TYPE_INVOICE)
                    ->get();

                foreach ($items as $item) {
                    if (! empty($item->grn_item_id)) {
                        DB::table('grn_items')
                            ->where('id', $item->grn_item_id)
                            ->decrement('quantity_inv', (float) $item->quantity);
                    }
                    if (! empty($item->po_detail_item_id)) {
                        DB::table('purch_order_details')
                            ->where('po_detail_item', $item->po_detail_item_id)
                            ->decrement('qty_invoiced', (float) $item->quantity);
                    }
                }

                DB::table('supp_invoice_items')
                    ->where('supp_trans_no', $transNo)
                    ->where('supp_trans_type', self::TYPE_INVOICE)
                    ->delete();
            }

            GlTransHelper::deletePosted(self::TYPE_INVOICE, $transNo);
            $header->delete();
            $this->addAuditTrail(self::TYPE_INVOICE, $transNo, now()->toDateString(), 'Voided');

            return ['message' => 'Supplier invoice voided.', 'trans_type' => self::TYPE_INVOICE, 'trans_no' => $transNo];
        });
    }

    private function createSuppTransHeader(
        int $transNo,
        int $supplierId,
        string $reference,
        string $suppReference,
        string $tranDate,
        string $dueDate,
        float $ovAmount,
        float $ovGst,
        bool $taxIncluded
    ): SuppTrans {
        return SuppTrans::query()->create([
            'trans_no' => $transNo,
            'trans_type' => self::TYPE_INVOICE,
            'supplier_id' => $supplierId,
            'reference' => $reference,
            'supp_reference' => $suppReference,
            'trans_date' => $tranDate,
            'due_date' => $dueDate,
            'ov_amount' => round($ovAmount, 2),
            'ov_discount' => 0,
            'ov_gst' => round($ovGst, 2),
            'rate' => SupplierExchangeRate::forSupplier($supplierId, $tranDate),
            'alloc' => 0,
            'tax_included' => $taxIncluded,
        ]);
    }

    /**
     * @param  array<int, array{item_code:string, quantity:float, unit_price:float}>  $lines
     */
    private function assertFixedAssetLines(array $lines): void
    {
        foreach ($lines as $line) {
            $stockId = (string) ($line['item_code'] ?? '');
            if ($stockId === '' || ! \Illuminate\Support\Facades\Schema::hasTable('stock_master')) {
                throw new InvalidArgumentException('Fixed asset purchase requires valid asset items.');
            }
            $mbFlag = (int) DB::table('stock_master')->where('stock_id', $stockId)->value('mb_flag');
            if ($mbFlag !== FaDepreciationService::FA_MB_FLAG) {
                throw new InvalidArgumentException("Item {$stockId} is not a fixed asset.");
            }
        }
    }

    private function glInvoiceItemRow(
        int $transNo,
        int $transType,
        string $glCode,
        float $amount,
        string $memo,
        int $dimensionId = 0
    ): array {
        return [
            'supp_trans_no' => $transNo,
            'supp_trans_type' => $transType,
            'gl_code' => $glCode,
            'grn_item_id' => null,
            'po_detail_item_id' => null,
            'stock_id' => null,
            'description' => $memo !== '' ? $memo : null,
            'quantity' => 0,
            'unit_price' => round($amount, 2),
            'unit_tax' => 0,
            'memo' => $memo,
            'dimension_id' => $dimensionId,
            'dimension2_id' => 0,
        ];
    }

    private function postInvoiceGl(SuppTrans $suppTrans): ?string
    {
        $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($suppTrans));

        return $run['gl_warning'];
    }

    private function addComment(int $type, int $transNo, string $date, string $memo): void
    {
        if ($memo === '' || ! Schema::hasTable('comments')) {
            return;
        }
        DB::table('comments')->insert([
            'type' => $type, 'id' => $transNo, 'date_' => $date, 'memo_' => $memo,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function addAuditTrail(int $type, int $transNo, string $glDate, string $description): void
    {
        if (! Schema::hasTable('audit_trail')) {
            return;
        }
        $range = ActiveFiscalYear::range($glDate);
        DB::table('audit_trail')->insert([
            'type' => $type, 'trans_no' => $transNo, 'user' => (int) (Auth::id() ?? 0),
            'description' => substr($description, 0, 60), 'fiscal_year' => (int) ($range['id'] ?? 0),
            'gl_date' => $glDate, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
