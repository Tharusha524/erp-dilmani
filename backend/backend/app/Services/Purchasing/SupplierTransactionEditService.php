<?php

namespace App\Services\Purchasing;

use App\Models\SuppTrans;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;
use App\Support\SupplierExchangeRate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

/**
 * FrontAccounting-style edit of posted supplier documents (header fields + GL repost).
 */
class SupplierTransactionEditService
{
    private const EDITABLE = [
        20 => ['trans_date', 'due_date', 'reference', 'supp_reference'],
        21 => ['trans_date', 'due_date', 'reference', 'supp_reference'],
        22 => ['trans_date', 'reference'],
    ];

    public function __construct(private PostingsService $postings) {}

    public function updateSuppDocument(int $transType, int $transNo, array $payload): array
    {
        $allowed = self::EDITABLE[$transType] ?? null;
        if ($allowed === null) {
            throw new InvalidArgumentException('This transaction type cannot be edited.');
        }

        return DB::transaction(function () use ($transType, $transNo, $payload, $allowed) {
            $header = SuppTrans::query()
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->first();

            if (! $header) {
                throw new InvalidArgumentException('Supplier transaction not found.');
            }

            if (abs((float) ($header->alloc ?? 0)) > 0.001 && $transType !== 22) {
                throw new InvalidArgumentException('Cannot edit a document that has allocations. Void it instead.');
            }

            $updates = [];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $payload)) {
                    $updates[$field] = $payload[$field];
                }
            }

            if (isset($updates['trans_date'])) {
                $updates['rate'] = SupplierExchangeRate::forSupplier(
                    (int) $header->supplier_id,
                    (string) $updates['trans_date']
                );
            }

            if ($updates !== []) {
                $header->update($updates);
                $header->refresh();
            }

            if (! empty($payload['comments']) && Schema::hasTable('comments')) {
                DB::table('comments')->updateOrInsert(
                    ['type' => $transType, 'id' => $transNo],
                    [
                        'date_' => $header->trans_date,
                        'memo_' => (string) $payload['comments'],
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            $glWarning = null;
            if (in_array($transType, [20, 21], true)) {
                $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($header->fresh()));
                $glWarning = $run['gl_warning'];
            } elseif ($transType === 22 && Schema::hasTable('bank_trans')) {
                $bankRow = DB::table('bank_trans')
                    ->where('type', 22)
                    ->where('trans_no', $transNo)
                    ->first();
                if ($bankRow) {
                    if (isset($updates['trans_date'])) {
                        DB::table('bank_trans')
                            ->where('type', 22)
                            ->where('trans_no', $transNo)
                            ->update(['trans_date' => $updates['trans_date'], 'updated_at' => now()]);
                        $bankRow = DB::table('bank_trans')->where('type', 22)->where('trans_no', $transNo)->first();
                    }
                    if (isset($updates['reference'])) {
                        DB::table('bank_trans')
                            ->where('type', 22)
                            ->where('trans_no', $transNo)
                            ->update(['ref' => $updates['reference'], 'updated_at' => now()]);
                        $bankRow = DB::table('bank_trans')->where('type', 22)->where('trans_no', $transNo)->first();
                    }
                    $run = GlPostingRunner::run(fn () => $this->postings->repostBankPayment($bankRow));
                    $glWarning = $run['gl_warning'];
                }
            }

            $result = [
                'message' => 'Transaction updated.',
                'trans_type' => $transType,
                'trans_no' => $transNo,
                'supp_trans' => $header->fresh()->toArray(),
            ];
            if ($glWarning) {
                $result['gl_warning'] = $glWarning;
            }

            return $result;
        });
    }
}
