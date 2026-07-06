<?php

namespace App\Services\Sales;

use App\Models\DebtorTrans;
use App\Services\Accounting\AllocationService;
use App\Services\Accounting\PostingsService;
use App\Services\FiscalYear\TransactionReferenceService;
use App\Support\ActiveFiscalYear;
use App\Support\CustomerExchangeRate;
use App\Support\DebtorTransSequence;
use App\Support\GlPostingRunner;
use App\Support\GlTransHelper;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class SalesPaymentService
{
    public const TYPE_PAYMENT = 12;

    public function __construct(
        private TransactionReferenceService $references,
        private PostingsService $postings,
        private AllocationService $allocations,
    ) {}

    /**
     * FrontAccounting write_customer_payment() + optional allocation::write().
     *
     * @param  array{
     *     debtor_no:int,
     *     branch_code:int,
     *     tran_date:string,
     *     bank_account_id:int,
     *     amount:float,
     *     discount?:float,
     *     bank_charge?:float,
     *     reference?:string|null,
     *     comments?:string|null,
     *     cost_center_id?:int,
     *     allocations?: array<int, array{trans_no_to:int, trans_type_to:int, amt:float}>
     * }  $payload
     */
    public function create(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $debtorNo = (int) ($payload['debtor_no'] ?? 0);
            $branchCode = (int) ($payload['branch_code'] ?? 0);
            $bankAccountId = (int) ($payload['bank_account_id'] ?? 0);
            $amount = round((float) ($payload['amount'] ?? 0), 2);
            $discount = round((float) ($payload['discount'] ?? 0), 2);
            $bankCharge = round((float) ($payload['bank_charge'] ?? 0), 2);

            if ($debtorNo <= 0 || $branchCode <= 0) {
                throw new InvalidArgumentException('Customer and branch are required.');
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

            $transNo = DebtorTransSequence::nextTransNo(self::TYPE_PAYMENT);
            $allocLines = $payload['allocations'] ?? [];
            $allocTotal = round(array_sum(array_column($allocLines, 'amt')), 2);
            if ($allocTotal > $amount + 0.01) {
                throw new InvalidArgumentException('Total allocation exceeds payment amount.');
            }

            $debtorTrans = DebtorTrans::query()->create([
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_PAYMENT,
                'version' => 0,
                'debtor_no' => $debtorNo,
                'branch_code' => $branchCode,
                'tran_date' => $tranDate,
                'due_date' => $tranDate,
                'reference' => $reference,
                'tpe' => 0,
                'order_no' => 0,
                'ov_amount' => $amount,
                'ov_gst' => 0,
                'ov_freight' => 0,
                'ov_freight_tax' => 0,
                'ov_discount' => $discount,
                'alloc' => 0,
                'prep_amount' => 0,
                'rate' => CustomerExchangeRate::forDebtor($debtorNo, $tranDate),
                'ship_via' => null,
                'cost_center_id' => (int) ($payload['cost_center_id'] ?? 0),
                'cost_center2_id' => 0,
                'payment_terms' => null,
                'tax_included' => 0,
            ]);

            $bankAmount = round($amount - $bankCharge, 2);
            if (Schema::hasTable('bank_trans')) {
                DB::table('bank_trans')->insert([
                    'trans_no' => $transNo,
                    'type' => self::TYPE_PAYMENT,
                    'bank_act' => $bankAccountId,
                    'ref' => $reference,
                    'trans_date' => $tranDate,
                    'amount' => $bankAmount,
                    'person_type_id' => 2,
                    'person_id' => $debtorNo,
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
            ];

            $glWarning = null;
            $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($bankRow));
            $glWarning = $run['gl_warning'];

            $this->addComment(self::TYPE_PAYMENT, $transNo, $tranDate, (string) ($payload['comments'] ?? ''));
            $this->addAuditTrail(self::TYPE_PAYMENT, $transNo, $tranDate, 'Created');

            if ($allocLines !== []) {
                $this->allocations->processCustomerAllocations(
                    $transNo,
                    self::TYPE_PAYMENT,
                    $tranDate,
                    $allocLines
                );
                $debtorTrans->refresh();
            }

            $result = [
                'trans_no' => $transNo,
                'trans_type' => self::TYPE_PAYMENT,
                'reference' => $reference,
                'debtor_trans' => $debtorTrans->fresh()->toArray(),
            ];
            if ($glWarning) {
                $result['gl_warning'] = $glWarning;
            }

            return $result;
        });
    }

    public function void(int $transNo, ?string $memo = null): array
    {
        return DB::transaction(function () use ($transNo, $memo) {
            $header = DebtorTrans::query()
                ->where('trans_type', self::TYPE_PAYMENT)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Customer payment not found.');
            }

            if (Schema::hasTable('cust_allocations')) {
                $this->allocations->voidCustomerDocumentAllocations($transNo, self::TYPE_PAYMENT);
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

            return ['message' => 'Customer payment voided.', 'trans_type' => self::TYPE_PAYMENT, 'trans_no' => $transNo];
        });
    }

    public function updatePosted(int $transNo, array $payload): array
    {
        return app(SalesTransactionEditService::class)->updateDebtorDocument(self::TYPE_PAYMENT, $transNo, $payload);
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
