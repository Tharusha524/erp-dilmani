<?php

namespace App\Repositories\All\BankTransInquiry;

use App\Models\BankTrans;
use App\Repositories\Base\BaseRepository;
use App\Services\Banking\BankBalanceService;
use Illuminate\Support\Facades\DB;

class BankTransInquiryRepository extends BaseRepository implements BankTransInquiryInterface
{
    public function __construct(
        BankTrans $model,
        private BankBalanceService $bankBalanceService
    ) {
        parent::__construct($model);
    }

    /**
     * Search bank transactions with FA-style opening / running / ending balances.
     */
    public function search(array $filters): array
    {
        $selectedAccount = (int) ($filters['selectedAccount'] ?? 0);
        $fromDate = $filters['fromDate'] ?? '';
        $toDate = $filters['toDate'] ?? '';

        if ($selectedAccount <= 0) {
            return $this->emptyResult();
        }

        $openingBalance = $fromDate
            ? $this->bankBalanceService->getBalanceBeforeDate($selectedAccount, $fromDate)
            : 0;

        $query = DB::table('bank_trans as bt')
            ->leftJoin('bank_accounts as ba', 'bt.bank_act', '=', 'ba.id')
            ->leftJoin('trans_types as tt', 'bt.type', '=', 'tt.trans_type')
            ->where('bt.bank_act', $selectedAccount)
            ->select(
                'bt.id',
                'bt.trans_no as number',
                'bt.type',
                DB::raw('COALESCE(tt.description, CAST(bt.type AS CHAR)) as type_name'),
                'bt.ref as reference',
                'bt.trans_date as date',
                DB::raw('CASE WHEN bt.amount > 0 THEN bt.amount ELSE 0 END as debit'),
                DB::raw('CASE WHEN bt.amount < 0 THEN ABS(bt.amount) ELSE 0 END as credit'),
                'bt.amount as line_amount',
                'ba.bank_account_name as personItem',
                DB::raw("'' as memo")
            );

        if (! empty($fromDate)) {
            $query->where('bt.trans_date', '>=', $fromDate);
        }

        if (! empty($toDate)) {
            $query->where('bt.trans_date', '<=', $toDate);
        }

        $rowsAsc = $query
            ->orderBy('bt.trans_date')
            ->orderBy('bt.id')
            ->get();

        $running = $openingBalance;
        $periodDebit = 0;
        $periodCredit = 0;
        $computedRows = [];

        foreach ($rowsAsc as $row) {
            $lineAmount = (float) $row->line_amount;
            $running += $lineAmount;
            $periodDebit += (float) $row->debit;
            $periodCredit += (float) $row->credit;

            $computedRows[] = [
                'id' => $row->id,
                'number' => $row->number,
                'type' => $row->type_name ?? $row->type,
                'reference' => $row->reference,
                'date' => $row->date,
                'debit' => round((float) $row->debit, 2),
                'credit' => round((float) $row->credit, 2),
                'balance' => round($running, 2),
                'personItem' => $row->personItem,
                'memo' => $row->memo,
            ];
        }

        $endingBalance = $toDate
            ? $this->bankBalanceService->getBalance($selectedAccount, $toDate)
            : ($openingBalance + $periodDebit - $periodCredit);

        return [
            'opening_balance' => round($openingBalance, 2),
            'ending_balance' => round($endingBalance, 2),
            'period_debit' => round($periodDebit, 2),
            'period_credit' => round($periodCredit, 2),
            'book_balance' => $this->bankBalanceService->getBalance($selectedAccount),
            'rows' => array_reverse($computedRows),
        ];
    }

    private function emptyResult(): array
    {
        return [
            'opening_balance' => 0,
            'ending_balance' => 0,
            'period_debit' => 0,
            'period_credit' => 0,
            'book_balance' => 0,
            'rows' => [],
        ];
    }
}
