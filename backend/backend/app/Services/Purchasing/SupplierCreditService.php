<?php

namespace App\Services\Purchasing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting get_current_supp_credit() / get_supplier_details_to_order() cur_credit.
 */
class SupplierCreditService
{
    /** ST_SUPPCREDIT */
    private const CREDIT_NOTE_TYPE = 21;

    public function suppTransGrossExpr(string $alias = 't'): string
    {
        $p = $alias !== '' ? $alias.'.' : '';

        return 'IFNULL('.$p.'ov_amount + '.$p.'ov_gst + '.$p.'ov_discount, 0)';
    }

    /**
     * FA: IF(trans.type=21, -1, 1) * (ov_amount + ov_gst + ov_discount) — gross, no alloc.
     */
    public function signedGrossExpr(string $alias = 't'): string
    {
        $p = $alias !== '' ? $alias.'.' : '';
        $gross = $this->suppTransGrossExpr($alias);

        return 'IF('.$p.'trans_type = '.self::CREDIT_NOTE_TYPE.', -1, 1) * ('.$gross.')';
    }

    public function outstandingBalance(int $supplierId): float
    {
        if ($supplierId <= 0 || ! Schema::hasTable('supp_trans')) {
            return 0.0;
        }

        return (float) (DB::table('supp_trans as t')
            ->where('t.supplier_id', $supplierId)
            ->selectRaw('SUM('.$this->signedGrossExpr('t').') as balance')
            ->value('balance') ?? 0);
    }

    public function creditLimit(int $supplierId): float
    {
        if ($supplierId <= 0 || ! Schema::hasTable('suppliers')) {
            return 0.0;
        }

        return (float) (DB::table('suppliers')
            ->where('supplier_id', $supplierId)
            ->value('credit_limit') ?? 0);
    }

    /**
     * @return array{
     *     credit_limit: float,
     *     outstanding_balance: float,
     *     available_credit: float|null,
     *     current_credit: float|null,
     *     has_credit_limit: bool
     * }
     */
    public function summary(int $supplierId): array
    {
        $limit = $this->creditLimit($supplierId);
        $outstanding = $this->outstandingBalance($supplierId);
        $hasLimit = $limit > 0.001;
        $available = $hasLimit ? round($limit - $outstanding, 2) : null;

        return [
            'credit_limit' => round($limit, 2),
            'outstanding_balance' => round($outstanding, 2),
            'available_credit' => $available,
            'current_credit' => $available,
            'has_credit_limit' => $hasLimit,
        ];
    }

    public function assertCanExtendCredit(int $supplierId, float $additionalAmount): void
    {
        $additionalAmount = round(max(0, $additionalAmount), 2);
        if ($supplierId <= 0 || $additionalAmount < 0.001) {
            return;
        }

        $summary = $this->summary($supplierId);
        if (! $summary['has_credit_limit']) {
            return;
        }

        $available = (float) ($summary['available_credit'] ?? 0);
        if ($additionalAmount > $available + 0.01) {
            throw new \InvalidArgumentException(sprintf(
                'Supplier credit limit exceeded. Available credit: %s. This document: %s.',
                number_format(max(0, $available), 2, '.', ''),
                number_format($additionalAmount, 2, '.', '')
            ));
        }
    }
}
