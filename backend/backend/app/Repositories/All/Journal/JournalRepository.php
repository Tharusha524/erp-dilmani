<?php

namespace App\Repositories\All\Journal;

use App\Models\Journal;
use App\Repositories\Base\BaseRepository;
use App\Services\Accounting\VoidTransactionService;
use App\Support\GlBalanceQuery;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class JournalRepository extends BaseRepository implements JournalInterface
{
    public function __construct(Journal $model)
    {
        parent::__construct($model);
    }

    /**
     * Journal inquiry grouped by transaction (FrontAccounting-style) from gl_trans.
     */
    public function search(array $filters): Collection
    {
        if (! Schema::hasTable('gl_trans')) {
            return collect();
        }

        $fromDate = $filters['fromDate'] ?? '';
        $toDate = $filters['toDate'] ?? '';
        $reference = $filters['reference'] ?? '';
        $type = $filters['type'] ?? '';
        $memo = $filters['memo'] ?? '';
        $userId = $filters['userId'] ?? '';
        $isPosted = $filters['isPosted'] ?? null;

        $dateCol = GlBalanceQuery::glEffectiveDateExpr('gl');
        $glMemoExpr = Schema::hasColumn('gl_trans', 'memo')
            ? 'COALESCE(MAX(gl.memo), "")'
            : (Schema::hasColumn('gl_trans', 'memo_')
                ? 'COALESCE(MAX(gl.memo_), "")'
                : '""');

        // Aggregate GL first — joining bank/debtor/supp before GROUP BY inflated amounts.
        $glAgg = DB::table('gl_trans as gl')
            ->select(
                'gl.type',
                'gl.type_no',
                DB::raw("MAX({$dateCol}) as tran_date"),
                DB::raw('MAX(gl.reference) as gl_reference'),
                DB::raw("{$glMemoExpr} as gl_memo"),
                DB::raw('SUM(COALESCE(gl.debit, 0)) as total_debit'),
                DB::raw('SUM(COALESCE(gl.credit, 0)) as total_credit')
            )
            ->groupBy('gl.type', 'gl.type_no')
            ->havingRaw('SUM(COALESCE(gl.debit, 0)) + SUM(COALESCE(gl.credit, 0)) > 0.00001');

        if ($fromDate) {
            $glAgg->whereRaw("DATE({$dateCol}) >= ?", [$fromDate]);
        }
        if ($toDate) {
            $glAgg->whereRaw("DATE({$dateCol}) <= ?", [$toDate]);
        }
        if ($type !== '') {
            $glAgg->where('gl.type', $type);
        }
        if ($reference !== '') {
            $like = '%'.$reference.'%';
            $glAgg->where(function ($q) use ($like) {
                $q->where('gl.reference', 'like', $like);
                if (Schema::hasTable('debtor_trans')) {
                    $q->orWhereExists(function ($sub) use ($like) {
                        $sub->select(DB::raw('1'))
                            ->from('debtor_trans as dt')
                            ->whereColumn('dt.trans_type', DB::raw('CAST(gl.type AS UNSIGNED)'))
                            ->whereColumn('dt.trans_no', 'gl.type_no')
                            ->where('dt.reference', 'like', $like);
                    });
                }
                if (Schema::hasTable('supp_trans')) {
                    $q->orWhereExists(function ($sub) use ($like) {
                        $sub->select(DB::raw('1'))
                            ->from('supp_trans as st')
                            ->whereColumn('st.trans_type', DB::raw('CAST(gl.type AS UNSIGNED)'))
                            ->whereColumn('st.trans_no', 'gl.type_no')
                            ->where('st.reference', 'like', $like);
                    });
                }
                if (Schema::hasTable('bank_trans')) {
                    $q->orWhereExists(function ($sub) use ($like) {
                        $sub->select(DB::raw('1'))
                            ->from('bank_trans as bt')
                            ->whereColumn('bt.type', DB::raw('CAST(gl.type AS UNSIGNED)'))
                            ->whereColumn('bt.trans_no', 'gl.type_no')
                            ->where('bt.ref', 'like', $like);
                    });
                }
            });
        }

        $query = DB::query()->fromSub($glAgg, 't');

        $query->leftJoin('audit_trail as a', function ($join) {
            $join->on(DB::raw('CAST(t.type AS UNSIGNED)'), '=', 'a.type')
                ->on('t.type_no', '=', 'a.trans_no');
        });

        if (Schema::hasTable('comments')) {
            $query->leftJoin('comments as com', function ($join) {
                $join->on(DB::raw('CAST(t.type AS UNSIGNED)'), '=', 'com.type')
                    ->on('t.type_no', '=', 'com.id');
            });
        }

        if (Schema::hasTable('user_managements')) {
            $query->leftJoin('user_managements as u', 'a.user', '=', 'u.id');
        }

        if (Schema::hasTable('debtor_trans')) {
            $query->leftJoin('debtor_trans as dt', function ($join) {
                $join->on('dt.trans_type', '=', DB::raw('CAST(t.type AS UNSIGNED)'))
                    ->on('t.type_no', '=', 'dt.trans_no');
            });
        }

        if (Schema::hasTable('supp_trans')) {
            $query->leftJoin('supp_trans as st', function ($join) {
                $join->on('st.trans_type', '=', DB::raw('CAST(t.type AS UNSIGNED)'))
                    ->on('t.type_no', '=', 'st.trans_no');
            });
        }

        if (Schema::hasTable('bank_trans')) {
            $query->leftJoin('bank_trans as bt', function ($join) {
                $join->on('bt.type', '=', DB::raw('CAST(t.type AS UNSIGNED)'))
                    ->on('bt.trans_no', '=', 't.type_no');
            });
        }

        $memoSelect = Schema::hasTable('comments')
            ? 'COALESCE(MAX(com.memo_), t.gl_memo, "")'
            : 'COALESCE(t.gl_memo, "")';

        $userSelect = Schema::hasTable('user_managements')
            ? 'COALESCE(MAX(u.id), 0)'
            : '0';

        $query->select(
            DB::raw('COALESCE(MAX(a.gl_seq), 0) as gl_seq'),
            't.tran_date',
            DB::raw('CAST(t.type AS CHAR) as trans_type'),
            't.type_no as trans_no',
            DB::raw('COALESCE(NULLIF(t.gl_reference, \'\'), MAX(dt.reference), MAX(st.reference), MAX(bt.ref), \'\') as reference'),
            DB::raw('COALESCE(MAX(st.supp_reference), "") as supp_reference'),
            DB::raw('COALESCE(MAX(dt.debtor_no), 0) as debtor_no'),
            DB::raw('COALESCE(MAX(st.supplier_id), 0) as supplier_id'),
            DB::raw('ROUND(t.total_debit, 2) as amount'),
            DB::raw("{$memoSelect} as memo"),
            DB::raw("{$userSelect} as user_id")
        )
            ->groupBy(
                't.type',
                't.type_no',
                't.tran_date',
                't.gl_reference',
                't.gl_memo',
                't.total_debit',
                't.total_credit'
            );

        if ($memo !== '' && Schema::hasTable('comments')) {
            $query->where('com.memo_', 'like', '%'.$memo.'%');
        }
        if ($userId !== '' && Schema::hasTable('user_managements')) {
            $query->where('u.id', $userId);
        }

        if ($isPosted === false) {
            $query->havingRaw('COALESCE(MAX(a.gl_seq), 0) = 0');
        } elseif ($isPosted === true) {
            $query->havingRaw('COALESCE(MAX(a.gl_seq), 0) > 0');
        }

        return $query
            ->orderByDesc('t.tran_date')
            ->orderByDesc('t.type_no')
            ->get();
    }

    /**
     * Remove a posted transaction via void (FA-style) — reversing GL + audit trail.
     */
    public function deleteTransaction(int $transType, int $transNo, ?string $voidDate = null, ?string $memo = null): bool
    {
        try {
            app(VoidTransactionService::class)->void(
                $transType,
                $transNo,
                $voidDate ?? now()->toDateString(),
                $memo
            );

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function resolveTransactionReference(int $transType, int $transNo): string
    {
        if (Schema::hasTable('bank_trans')) {
            $ref = DB::table('bank_trans')
                ->where('type', $transType)
                ->where('trans_no', $transNo)
                ->value('ref');
            if ($ref) {
                return (string) $ref;
            }
        }

        if (Schema::hasTable('journal')) {
            $ref = DB::table('journal')
                ->where('type', $transType)
                ->where('trans_no', $transNo)
                ->value('reference');
            if ($ref) {
                return (string) $ref;
            }
        }

        return '';
    }
}
