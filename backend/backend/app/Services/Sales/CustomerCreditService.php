<?php

namespace App\Services\Sales;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CustomerCreditService
{
    /** FrontAccounting: ST_BANKDEPOSIT, ST_CUSTCREDIT, ST_CUSTPAYMENT */
    private const CREDIT_REDUCING_TYPES = [2, 11, 12];

    /** FrontAccounting: delivery notes are excluded from customer balance / cur_credit */
    private const EXCLUDED_FROM_BALANCE = [13];

    public function debtorNetExpr(string $alias = 't'): string
    {
        $p = $alias !== '' ? $alias.'.' : '';

        return 'IFNULL('.$p.'ov_amount + '.$p.'ov_gst + '.$p.'ov_freight + '.$p.'ov_freight_tax + '.$p.'ov_discount, 0)';
    }

    /**
     * FrontAccounting get_customer_details() balance: signed (net - alloc), delivery excluded.
     */
    public function signedBalanceExpr(string $alias = 't', bool $subtractAlloc = true): string
    {
        $p = $alias !== '' ? $alias.'.' : '';
        $net = $this->debtorNetExpr($alias);
        $alloc = $subtractAlloc ? ' - IFNULL('.$p.'alloc, 0)' : '';
        $reducing = implode(',', self::CREDIT_REDUCING_TYPES);

        return 'IF('.$p.'trans_type IN ('.$reducing.'), -1, 1) * ('.$net.$alloc.')';
    }

    public function outstandingBalance(int $debtorNo): float
    {
        if ($debtorNo <= 0 || ! Schema::hasTable('debtor_trans')) {
            return 0.0;
        }

        return (float) (DB::table('debtor_trans as t')
            ->where('t.debtor_no', $debtorNo)
            ->whereNotIn('t.trans_type', self::EXCLUDED_FROM_BALANCE)
            ->selectRaw('SUM('.$this->signedBalanceExpr('t', true).') as balance')
            ->value('balance') ?? 0);
    }

    public function creditLimit(int $debtorNo): float
    {
        if ($debtorNo <= 0) {
            return 0.0;
        }

        if (Schema::hasTable('debtors_master')) {
            return (float) (DB::table('debtors_master')
                ->where('debtor_no', $debtorNo)
                ->value('credit_limit') ?? 0);
        }

        if (Schema::hasTable('customers')) {
            return (float) (DB::table('customers')
                ->where('debtor_no', $debtorNo)
                ->value('credit_limit') ?? 0);
        }

        return 0.0;
    }

    /**
     * @return array{credit_limit: float, outstanding_balance: float, available_credit: float|null, has_credit_limit: bool}
     */
    public function summary(int $debtorNo): array
    {
        $limit = $this->creditLimit($debtorNo);
        $outstanding = $this->outstandingBalance($debtorNo);
        $hasLimit = $limit > 0.001;

        return [
            'credit_limit' => round($limit, 2),
            'outstanding_balance' => round($outstanding, 2),
            'available_credit' => $hasLimit ? round($limit - $outstanding, 2) : null,
            'has_credit_limit' => $hasLimit,
        ];
    }

    /**
     * FrontAccounting blocks invoice/delivery when credit_status.disallow_invoices is set.
     */
    public function assertInvoicingAllowed(int $debtorNo): void
    {
        if ($debtorNo <= 0 || ! Schema::hasTable('debtors_master')) {
            return;
        }

        $disallowed = DB::table('debtors_master as d')
            ->leftJoin('credit_status_setups as cs', 'd.credit_status', '=', 'cs.id')
            ->where('d.debtor_no', $debtorNo)
            ->value('cs.disallow_invoices');

        if ($disallowed) {
            throw new \InvalidArgumentException(
                'The selected customer account is currently on hold. Please contact credit control.'
            );
        }
    }

    /**
     * FrontAccounting credit check applies when posting sales invoices (type 10).
     * Delivery notes (13) do not affect customer balance until invoiced.
     */
    public function assertCanExtendCredit(int $debtorNo, float $additionalAmount): void
    {
        $additionalAmount = round(max(0, $additionalAmount), 2);
        if ($debtorNo <= 0 || $additionalAmount < 0.001) {
            return;
        }

        $summary = $this->summary($debtorNo);
        if (! $summary['has_credit_limit']) {
            return;
        }

        $available = (float) ($summary['available_credit'] ?? 0);
        if ($additionalAmount > $available + 0.01) {
            throw new \InvalidArgumentException(sprintf(
                'Customer credit limit exceeded. Available credit: %s. This document: %s.',
                number_format(max(0, $available), 2, '.', ''),
                number_format($additionalAmount, 2, '.', '')
            ));
        }
    }
}
