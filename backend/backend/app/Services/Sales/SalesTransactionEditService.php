<?php

namespace App\Services\Sales;

use App\Models\DebtorTrans;
use App\Services\Accounting\PostingsService;
use App\Support\CustomerExchangeRate;
use App\Support\GlPostingRunner;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * FrontAccounting-style edit of posted sales documents (header fields + GL repost).
 */
class SalesTransactionEditService
{
    private const EDITABLE = [
        10 => ['tran_date', 'due_date', 'reference', 'dimension_id', 'dimension2_id', 'ship_via', 'payment_terms'],
        11 => ['tran_date', 'reference', 'dimension_id', 'dimension2_id'],
        12 => ['tran_date', 'reference', 'dimension_id'],
        13 => ['tran_date', 'due_date', 'reference', 'dimension_id', 'dimension2_id', 'ship_via'],
    ];

    public function __construct(private PostingsService $postings) {}

    public function updateDebtorDocument(int $transType, int $transNo, array $payload): array
    {
        $allowed = self::EDITABLE[$transType] ?? null;
        if ($allowed === null) {
            throw new InvalidArgumentException('This transaction type cannot be edited.');
        }

        return DB::transaction(function () use ($transType, $transNo, $payload, $allowed) {
            $header = DebtorTrans::query()
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Transaction not found.');
            }

            if ((float) ($header->alloc ?? 0) > 0.001 && $transType !== 12) {
                throw new InvalidArgumentException('Cannot edit a document that has allocations. Void it instead.');
            }

            $updates = [];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $payload)) {
                    $updates[$field] = $payload[$field];
                }
            }

            if (isset($updates['tran_date'])) {
                $updates['rate'] = CustomerExchangeRate::forDebtor((int) $header->debtor_no, (string) $updates['tran_date']);
            }

            if ($updates !== []) {
                $header->update($updates);
                $header->refresh();
            }

            if (! empty($payload['comments']) && Schema::hasTable('comments')) {
                DB::table('comments')->updateOrInsert(
                    ['type' => $transType, 'id' => $transNo],
                    [
                        'date_' => $header->tran_date,
                        'memo_' => (string) $payload['comments'],
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            $glWarning = null;
            if (in_array($transType, [10, 11, 13], true)) {
                $run = GlPostingRunner::run(fn () => $this->postings->repostDebtorTrans($header->fresh()));
                $glWarning = $run['gl_warning'];
            } elseif ($transType === 12 && Schema::hasTable('bank_trans')) {
                $bankRow = DB::table('bank_trans')
                    ->where('type', 12)
                    ->where('trans_no', $transNo)
                    ->first();
                if ($bankRow) {
                    if (isset($updates['tran_date'])) {
                        DB::table('bank_trans')
                            ->where('type', 12)
                            ->where('trans_no', $transNo)
                            ->update(['trans_date' => $updates['tran_date'], 'updated_at' => now()]);
                        $bankRow = DB::table('bank_trans')->where('type', 12)->where('trans_no', $transNo)->first();
                    }
                    $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($bankRow));
                    $glWarning = $run['gl_warning'];
                }
            }

            $result = [
                'message' => 'Transaction updated.',
                'trans_type' => $transType,
                'trans_no' => $transNo,
                'debtor_trans' => $header->fresh()->toArray(),
            ];
            if ($glWarning) {
                $result['gl_warning'] = $glWarning;
            }

            return $result;
        });
    }
}
