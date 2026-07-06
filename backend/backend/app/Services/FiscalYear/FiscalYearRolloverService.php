<?php

namespace App\Services\FiscalYear;

use App\Models\CompanySetup;
use App\Models\FiscalYear;
use App\Support\GlAccountResolver;
use App\Support\GlBalanceQuery;
use App\Support\GlTransHelper;
use App\Support\TrialAccountBalance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FiscalYearRolloverService
{
    private const JOURNAL_TYPE = 0;

    /**
     * Close fiscal years that ended on or before $asOfDate and open the next period.
     *
     * @return array<int, array<string, mixed>>
     */
    public function processDueRollovers(?string $asOfDate = null): array
    {
        $asOf = Carbon::parse($asOfDate ?? now()->toDateString())->startOfDay();
        $results = [];

        $dueYears = FiscalYear::query()
            ->where('closed', false)
            ->whereDate('fiscal_year_to', '<=', $asOf)
            ->orderBy('fiscal_year_to')
            ->get();

        foreach ($dueYears as $year) {
            $results[] = $this->rolloverYear($year);
        }

        return $results;
    }

    /**
     * @return array<string, mixed>
     */
    public function rolloverYear(FiscalYear $year, bool $force = false): array
    {
        if ($year->closed && ! $force) {
            return [
                'fiscal_year_id' => $year->id,
                'status' => 'skipped',
                'message' => 'Fiscal year is already closed.',
            ];
        }

        return DB::transaction(function () use ($year) {
            $closingLines = $this->postClosingEntries($year);

            $year->update(['closed' => true]);

            $nextYear = $this->createNextFiscalYear($year);
            $updatedCompanies = $this->activateNextYearForCompanies($year, $nextYear);

            return [
                'fiscal_year_id' => $year->id,
                'closed_from' => $year->fiscal_year_from,
                'closed_to' => $year->fiscal_year_to,
                'closing_journal_lines' => $closingLines,
                'new_fiscal_year_id' => $nextYear->id,
                'new_fiscal_year_from' => $nextYear->fiscal_year_from,
                'new_fiscal_year_to' => $nextYear->fiscal_year_to,
                'companies_updated' => $updatedCompanies,
                'status' => 'rolled_over',
                'message' => 'Fiscal year closed and next period opened.',
            ];
        });
    }

    private function postClosingEntries(FiscalYear $year): int
    {
        if (! Schema::hasTable('gl_trans') || ! Schema::hasColumn('gl_trans', 'account')) {
            return 0;
        }

        $typeNo = 900000 + (int) $year->id;
        if (GlTransHelper::alreadyPosted(self::JOURNAL_TYPE, $typeNo)) {
            return 0;
        }

        $profitLossAccount = GlAccountResolver::resolve(
            'profitLossYear',
            DB::table('sys_prefs')->where('name', 'profitLossYear')->value('value')
        );
        $retainedAccount = GlAccountResolver::resolve(
            'retainedEarnings',
            DB::table('sys_prefs')->where('name', 'retainedEarnings')->value('value')
        );

        if (! $profitLossAccount || ! $retainedAccount) {
            return 0;
        }

        $balances = $this->profitAndLossBalances($year);
        if ($balances->isEmpty()) {
            return 0;
        }

        $closeDate = $year->fiscal_year_to;
        $reference = 'FY-CLOSE-'.$year->id;
        $memo = 'Year-end closing '.$year->fiscal_year_from.' to '.$year->fiscal_year_to;
        $lines = [];
        $netSigned = 0.0;

        foreach ($balances as $row) {
            $balance = round((float) $row->balance, 2);
            if (abs($balance) < 0.001) {
                continue;
            }

            $netSigned += $balance;

            if ($balance > 0) {
                $lines[] = $this->journalLine($row->account_code, 0, $balance, $closeDate, $typeNo, $reference, $memo);
                $lines[] = $this->journalLine($profitLossAccount, $balance, 0, $closeDate, $typeNo, $reference, $memo);
            } else {
                $amount = abs($balance);
                $lines[] = $this->journalLine($row->account_code, $amount, 0, $closeDate, $typeNo, $reference, $memo);
                $lines[] = $this->journalLine($profitLossAccount, 0, $amount, $closeDate, $typeNo, $reference, $memo);
            }
        }

        $netSigned = round($netSigned, 2);
        if (abs($netSigned) >= 0.001) {
            if ($netSigned > 0) {
                $lines[] = $this->journalLine($profitLossAccount, 0, $netSigned, $closeDate, $typeNo, $reference, $memo);
                $lines[] = $this->journalLine($retainedAccount, $netSigned, 0, $closeDate, $typeNo, $reference, $memo);
            } else {
                $amount = abs($netSigned);
                $lines[] = $this->journalLine($profitLossAccount, $amount, 0, $closeDate, $typeNo, $reference, $memo);
                $lines[] = $this->journalLine($retainedAccount, 0, $amount, $closeDate, $typeNo, $reference, $memo);
            }
        }

        if ($lines === []) {
            return 0;
        }

        $this->assertBalanced($lines);
        GlTransHelper::insertLines($lines);

        return count($lines);
    }

    private function profitAndLossBalances(FiscalYear $year): Collection
    {
        $from = $year->fiscal_year_from;
        $to = $year->fiscal_year_to;
        $debitExpr = GlBalanceQuery::rangeDebitSumExpr('gt', $from, $to);
        $creditExpr = GlBalanceQuery::rangeCreditSumExpr('gt', $from, $to);

        return DB::table('chart_master as cm')
            ->leftJoin('gl_trans as gt', function ($join) {
                $join->on(DB::raw('TRIM(cm.account_code)'), '=', DB::raw('TRIM(gt.account)'));
            })
            ->groupBy('cm.account_code', 'cm.account_name', 'cm.account_type')
            ->selectRaw(
                "cm.account_code, cm.account_name, cm.account_type,
                {$debitExpr} as period_debit, {$creditExpr} as period_credit"
            )
            ->get()
            ->map(function ($row) {
                $type = (int) $row->account_type;
                if (! TrialAccountBalance::isProfitAndLossAccount($type)) {
                    return null;
                }

                $balance = TrialAccountBalance::signedBalance(
                    (float) $row->period_debit,
                    (float) $row->period_credit,
                    $type
                );
                if (abs($balance) < 0.001) {
                    return null;
                }

                return (object) [
                    'account_code' => $row->account_code,
                    'account_name' => $row->account_name,
                    'balance' => round($balance, 2),
                ];
            })
            ->filter()
            ->values();
    }

    private function createNextFiscalYear(FiscalYear $year): FiscalYear
    {
        $from = Carbon::parse($year->fiscal_year_from);
        $to = Carbon::parse($year->fiscal_year_to);
        $nextFrom = $to->copy()->addDay();
        $nextTo = $nextFrom->copy()->addDays($from->diffInDays($to));

        $existing = FiscalYear::query()
            ->whereDate('fiscal_year_from', $nextFrom->toDateString())
            ->first();

        if ($existing) {
            if ($existing->closed) {
                $existing->update(['closed' => false]);
            }

            return $existing;
        }

        return FiscalYear::query()->create([
            'fiscal_year_from' => $nextFrom->toDateString(),
            'fiscal_year_to' => $nextTo->toDateString(),
            'closed' => false,
        ]);
    }

    private function activateNextYearForCompanies(FiscalYear $closedYear, FiscalYear $nextYear): int
    {
        if (! Schema::hasTable('company_setup')) {
            return 0;
        }

        return CompanySetup::query()
            ->where('fiscal_year_id', $closedYear->id)
            ->update(['fiscal_year_id' => $nextYear->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function journalLine(
        string $account,
        float $debit,
        float $credit,
        string $date,
        int $typeNo,
        string $reference,
        string $memo
    ): array {
        return [
            'type' => self::JOURNAL_TYPE,
            'type_no' => $typeNo,
            'reference' => $reference,
            'date' => $date,
            'tran_date' => $date,
            'account' => $account,
            'debit' => round($debit, 2),
            'credit' => round($credit, 2),
            'memo' => $memo,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function assertBalanced(array $lines): void
    {
        $debits = array_sum(array_map(fn ($line) => (float) ($line['debit'] ?? 0), $lines));
        $credits = array_sum(array_map(fn ($line) => (float) ($line['credit'] ?? 0), $lines));

        if (abs($debits - $credits) > 0.01) {
            throw new \RuntimeException('Year-end closing journal is not balanced.');
        }
    }
}
