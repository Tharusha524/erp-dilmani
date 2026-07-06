<?php

namespace App\Services\Purchasing;

use App\Models\SuppTrans;
use App\Services\Accounting\AllocationService;
use App\Services\Accounting\PostingsService;
use App\Services\FiscalYear\TransactionReferenceService;
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
 * FrontAccounting write_supp_credit() — supplier credit note.
 */
class SupplierCreditNoteService
{
    public const TYPE_CREDIT = 21;

    public function __construct(
        private TransactionReferenceService $references,
        private PostingsService $postings,
        private AllocationService $allocations,
        private PurchaseTaxCalculator $purchaseTax,
    ) {}

    /**
     * @param  array{
     *     supplier_id:int,
     *     trans_date:string,
     *     due_date?:string|null,
     *     reference?:string|null,
     *     supp_reference?:string|null,
     *     tax_included?:bool,
     *     comments?:string|null,
     *     source_invoice_trans_no?:int|null,
     *     allocations?: array<int, array{trans_no_to:int, trans_type_to:int, amt:float}>,
     *     lines?: array<int, array{stock_id?:string, quantity:float, unit_price:float, grn_item_id?:int|null, po_detail_item_id?:int|null, description?:string|null}>,
     *     gl_lines?: array<int, array{gl_code:string, amount:float, memo?:string|null, dimension_id?:int|null}>
     * }  $payload
     */
    public function create(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $supplierId = (int) ($payload['supplier_id'] ?? 0);
            if ($supplierId <= 0) {
                throw new InvalidArgumentException('Supplier is required.');
            }

            $lines = $payload['lines'] ?? [];
            $glInputLines = $payload['gl_lines'] ?? [];
            if ($lines === [] && $glInputLines === []) {
                throw new InvalidArgumentException('At least one credit line or GL line is required.');
            }

            $tranDate = (string) ($payload['trans_date'] ?? now()->toDateString());
            $dueDate = (string) ($payload['due_date'] ?? $tranDate);
            $reference = trim((string) ($payload['reference'] ?? ''));
            if ($reference === '') {
                $refData = $this->references->next(self::TYPE_CREDIT, $tranDate);
                $reference = (string) ($refData['reference'] ?? '');
            }

            $transNo = SuppTransSequence::nextTransNo(self::TYPE_CREDIT);
            $invoiceItems = [];
            $taxCalcLines = [];

            foreach ($lines as $line) {
                $qty = round((float) ($line['quantity'] ?? 0), 4);
                $price = round((float) ($line['unit_price'] ?? 0), 4);
                if ($qty <= 0) {
                    continue;
                }

                $stockId = (string) ($line['stock_id'] ?? '');
                if ($stockId !== '') {
                    $taxCalcLines[] = [
                        'stock_id' => $stockId,
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'discount_percent' => 0,
                    ];
                }

                $invoiceItems[] = [
                    'supp_trans_no' => $transNo,
                    'supp_trans_type' => self::TYPE_CREDIT,
                    'gl_code' => '0',
                    'grn_item_id' => $line['grn_item_id'] ?? null,
                    'po_detail_item_id' => $line['po_detail_item_id'] ?? null,
                    'stock_id' => $stockId !== '' ? $stockId : null,
                    'description' => $line['description'] ?? null,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'unit_tax' => 0,
                    'memo' => '',
                    'dimension_id' => 0,
                    'dimension2_id' => 0,
                ];
            }

            foreach ($glInputLines as $glLine) {
                $amount = round((float) ($glLine['amount'] ?? 0), 2);
                $glCode = trim((string) ($glLine['gl_code'] ?? ''));
                if ($glCode === '' || abs($amount) < 0.001) {
                    continue;
                }
                $invoiceItems[] = [
                    'supp_trans_no' => $transNo,
                    'supp_trans_type' => self::TYPE_CREDIT,
                    'gl_code' => $glCode,
                    'grn_item_id' => null,
                    'po_detail_item_id' => null,
                    'stock_id' => null,
                    'description' => (string) ($glLine['memo'] ?? ''),
                    'quantity' => 0,
                    'unit_price' => $amount,
                    'unit_tax' => 0,
                    'memo' => (string) ($glLine['memo'] ?? ''),
                    'dimension_id' => (int) ($glLine['dimension_id'] ?? 0),
                    'dimension2_id' => 0,
                ];
            }

            if ($invoiceItems === []) {
                throw new InvalidArgumentException('No valid credit quantities.');
            }

            $taxIncluded = (bool) ($payload['tax_included'] ?? false);
            $taxResult = $this->purchaseTax->calculateForSupplier($supplierId, $taxIncluded, $taxCalcLines);
            $ovAmount = (float) $taxResult['ov_amount'];
            $ovGst = (float) $taxResult['ov_gst'];

            $stockLineIdx = 0;
            foreach ($invoiceItems as &$item) {
                if (empty($item['grn_item_id']) && ($item['stock_id'] ?? null) === null) {
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
                if (($item['stock_id'] ?? null) === null && trim((string) ($item['gl_code'] ?? '')) !== '' && (string) ($item['gl_code'] ?? '') !== '0') {
                    $glLineTotal += round((float) ($item['unit_price'] ?? 0), 2);
                }
            }

            $headerNet = round($ovAmount + $glLineTotal, 2);
            $headerTotal = round($headerNet + $ovGst, 2);

            $suppTrans = SuppTrans::query()->create([
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_CREDIT,
                'supplier_id' => $supplierId,
                'reference' => $reference,
                'supp_reference' => (string) ($payload['supp_reference'] ?? ''),
                'trans_date' => $tranDate,
                'due_date' => $dueDate,
                'ov_amount' => -$headerNet,
                'ov_discount' => 0,
                'ov_gst' => $taxIncluded ? 0 : -round($ovGst, 2),
                'rate' => SupplierExchangeRate::forSupplier($supplierId, $tranDate),
                'alloc' => 0,
                'tax_included' => $taxIncluded,
            ]);

            foreach ($invoiceItems as $item) {
                DB::table('supp_invoice_items')->insert(array_merge($item, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            foreach ($invoiceItems as $item) {
                $grnItemId = (int) ($item['grn_item_id'] ?? 0);
                $qty = round((float) ($item['quantity'] ?? 0), 4);
                if ($grnItemId <= 0 || $qty <= 0) {
                    continue;
                }

                DB::table('grn_items')
                    ->where('id', $grnItemId)
                    ->decrement('quantity_inv', $qty);

                $poDetailId = (int) ($item['po_detail_item_id'] ?? 0);
                if ($poDetailId > 0 && Schema::hasTable('purch_order_details')) {
                    DB::table('purch_order_details')
                        ->where('po_detail_item', $poDetailId)
                        ->decrement('qty_invoiced', $qty);
                }
            }

            $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($suppTrans));
            $glWarning = $run['gl_warning'];

            $this->addComment(self::TYPE_CREDIT, $transNo, $tranDate, (string) ($payload['comments'] ?? ''));
            $this->addAuditTrail(self::TYPE_CREDIT, $transNo, $tranDate, 'Created');

            $allocLines = $payload['allocations'] ?? [];
            $sourceInvoice = (int) ($payload['source_invoice_trans_no'] ?? 0);
            if ($allocLines === [] && $sourceInvoice > 0 && $headerTotal > 0.001) {
                $allocLines = [[
                    'trans_no_to' => $sourceInvoice,
                    'trans_type_to' => 20,
                    'amt' => $headerTotal,
                ]];
            }
            if ($allocLines !== []) {
                $this->allocations->processSupplierAllocations(
                    $transNo,
                    self::TYPE_CREDIT,
                    $tranDate,
                    $allocLines
                );
                $suppTrans->refresh();
            }

            $result = [
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_CREDIT,
                'reference' => $reference,
                'supp_trans' => $suppTrans->fresh()->toArray(),
            ];
            if ($glWarning) {
                $result['gl_warning'] = $glWarning;
            }

            return $result;
        });
    }

    public function void(int $transNo, ?string $memo = null): array
    {
        return DB::transaction(function () use ($transNo) {
            $header = SuppTrans::query()
                ->where('trans_type', self::TYPE_CREDIT)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Supplier credit note not found.');
            }

            if (Schema::hasTable('supp_allocations')) {
                $this->allocations->voidSupplierDocumentAllocations($transNo, self::TYPE_CREDIT);
            }

            if (Schema::hasTable('supp_invoice_items')) {
                $items = DB::table('supp_invoice_items')
                    ->where('supp_trans_no', $transNo)
                    ->where('supp_trans_type', self::TYPE_CREDIT)
                    ->get();

                foreach ($items as $item) {
                    if (! empty($item->grn_item_id)) {
                        DB::table('grn_items')
                            ->where('id', $item->grn_item_id)
                            ->increment('quantity_inv', (float) $item->quantity);
                    }
                    if (! empty($item->po_detail_item_id) && Schema::hasTable('purch_order_details')) {
                        DB::table('purch_order_details')
                            ->where('po_detail_item', $item->po_detail_item_id)
                            ->increment('qty_invoiced', (float) $item->quantity);
                    }
                }

                DB::table('supp_invoice_items')
                    ->where('supp_trans_no', $transNo)
                    ->where('supp_trans_type', self::TYPE_CREDIT)
                    ->delete();
            }

            GlTransHelper::deletePosted(self::TYPE_CREDIT, $transNo);
            $header->delete();
            $this->addAuditTrail(self::TYPE_CREDIT, $transNo, now()->toDateString(), 'Voided');

            return ['message' => 'Supplier credit note voided.', 'trans_type' => self::TYPE_CREDIT, 'trans_no' => $transNo];
        });
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
