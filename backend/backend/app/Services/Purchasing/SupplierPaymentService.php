<?php

namespace App\Services\Purchasing;

use App\Models\SuppTrans;
use App\Services\Accounting\AllocationService;
use App\Services\Accounting\PostingsService;
use App\Services\FiscalYear\TransactionReferenceService;
use App\Support\ActiveFiscalYear;
use App\Support\GlPostingRunner;
use App\Support\GlTransHelper;
use App\Support\SuppTransSequence;
use App\Support\SupplierExchangeRate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * FrontAccounting write_supp_payment() — supplier payment with optional allocation.
 */
class SupplierPaymentService
{
    public const TYPE_PAYMENT = 22;

    public function __construct(
        private TransactionReferenceService $references,
        private PostingsService $postings,
        private AllocationService $allocations,
    ) {}

    /**
     * @param  array{
     *     supplier_id:int,
     *     tran_date:string,
     *     bank_account_id:int,
     *     amount:float,
     *     discount?:float,
     *     bank_charge?:float,
     *     reference?:string|null,
     *     comments?:string|null,
     *     tax_included?:bool,
     *     allocations?: array<int, array{trans_no_to:int, trans_type_to:int, amt:float}>
     * }  $payload
     */
    public function create(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $supplierId = (int) ($payload['supplier_id'] ?? 0);
            $bankAccountId = (int) ($payload['bank_account_id'] ?? 0);
            $amount = round((float) ($payload['amount'] ?? 0), 2);
            $discount = round((float) ($payload['discount'] ?? 0), 2);
            $bankCharge = round((float) ($payload['bank_charge'] ?? 0), 2);

            if ($supplierId <= 0) {
                throw new InvalidArgumentException('Supplier is required.');
            }
            if ($bankAccountId <= 0) {
                throw new InvalidArgumentException('Bank account is required.');
            }
            if ($amount <= 0) {
                throw new InvalidArgumentException('Payment amount must be greater than zero.');
            }

            $tranDate = (string) ($payload['tran_date'] ?? now()->toDateString());
            $reference = trim((string) ($payload['reference'] ?? ''));
            if ($reference === '') {
                $refData = $this->references->next(self::TYPE_PAYMENT, $tranDate);
                $reference = (string) ($refData['reference'] ?? '');
            }

            $transNo = SuppTransSequence::nextTransNo(self::TYPE_PAYMENT);
            $allocLines = $payload['allocations'] ?? [];
            $allocTotal = round(array_sum(array_column($allocLines, 'amt')), 2);
            if ($allocTotal > $amount + $discount + 0.01) {
                throw new InvalidArgumentException('Total allocation exceeds payment amount.');
            }

            $suppTrans = SuppTrans::query()->create([
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_PAYMENT,
                'supplier_id' => $supplierId,
                'reference' => $reference,
                'supp_reference' => '',
                'trans_date' => $tranDate,
                'due_date' => $tranDate,
                'ov_amount' => -abs($amount),
                'ov_discount' => -abs($discount),
                'ov_gst' => 0,
                'rate' => SupplierExchangeRate::forSupplier($supplierId, $tranDate),
                'alloc' => 0,
                'tax_included' => (bool) ($payload['tax_included'] ?? false),
            ]);

            $costCenterId = (int) ($payload['cost_center_id'] ?? 0);

            $bankAmount = round(-1 * ($amount - $bankCharge), 2);
            if (Schema::hasTable('bank_trans')) {
                DB::table('bank_trans')->insert([
                    'trans_no' => $transNo,
                    'type' => self::TYPE_PAYMENT,
                    'bank_act' => $bankAccountId,
                    'ref' => $reference,
                    'trans_date' => $tranDate,
                    'amount' => $bankAmount,
                    'person_type_id' => 3,
                    'person_id' => $supplierId,
                    'cost_center_id' => $costCenterId ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $bankRow = (object) [
                'type' => self::TYPE_PAYMENT,
                'trans_no' => $transNo,
                'bank_act' => $bankAccountId,
                'ref' => $reference,
                'trans_date' => $tranDate,
                'amount' => $bankAmount,
                'cost_center_id' => $costCenterId ?: null,
            ];

            $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($bankRow));
            $glWarning = $run['gl_warning'];

            $this->addComment(self::TYPE_PAYMENT, $transNo, $tranDate, (string) ($payload['comments'] ?? ''));
            $this->addAuditTrail(self::TYPE_PAYMENT, $transNo, $tranDate, 'Created');

            if ($allocLines !== []) {
                $this->allocations->processSupplierAllocations(
                    $transNo,
                    self::TYPE_PAYMENT,
                    $tranDate,
                    $allocLines
                );
                $suppTrans->refresh();
            }

            $result = [
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_PAYMENT,
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
                ->where('trans_type', self::TYPE_PAYMENT)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Supplier payment not found.');
            }

            if (Schema::hasTable('supp_allocations')) {
                $this->allocations->voidSupplierDocumentAllocations($transNo, self::TYPE_PAYMENT);
            }

            GlTransHelper::deletePosted(self::TYPE_PAYMENT, $transNo);

            if (Schema::hasTable('bank_trans')) {
                DB::table('bank_trans')
                    ->where('type', self::TYPE_PAYMENT)
                    ->where('trans_no', $transNo)
                    ->delete();
            }

            $header->delete();
            $this->addAuditTrail(self::TYPE_PAYMENT, $transNo, now()->toDateString(), 'Voided');

            return ['message' => 'Supplier payment voided.', 'trans_type' => self::TYPE_PAYMENT, 'trans_no' => $transNo];
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
