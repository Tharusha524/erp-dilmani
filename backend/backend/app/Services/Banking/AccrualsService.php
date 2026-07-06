<?php

namespace App\Services\Banking;

use App\Support\ActiveFiscalYear;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * FrontAccounting accruals.php — multi-period journal accruals.
 */
class AccrualsService
{
    public function __construct(private BankingTransactionService $banking)
    {
    }

    /**
     * @return array{rows: array<int, array<string, mixed>>, periods: int, total_amount: float}
     */
    public function preview(array $data): array
    {
        return [
            'rows' => $this->buildSchedule($data),
            'periods' => (int) $data['periods'],
            'total_amount' => round((float) $data['amount'], 2),
        ];
    }

    /**
     * @return array{journals: array<int, array<string, mixed>>, periods: int}
     */
    public function process(array $data): array
    {
        $schedule = $this->buildSchedule($data);
        $memo = trim((string) ($data['memo'] ?? ''));
        if ($memo === '') {
            $memo = sprintf('Accruals for %s', number_format((float) $data['amount'], 2));
        }

        $journals = [];

        return DB::transaction(function () use ($schedule, $data, $memo, &$journals) {
            foreach ($schedule as $row) {
                $result = $this->banking->postJournal([
                    'tran_date' => $row['date'],
                    'memo' => $memo,
                    'lines' => [
                        [
                            'account_code' => $data['acc_act'],
                            'credit' => $row['amount'],
                            'debit' => 0,
                            'memo' => $memo,
                        ],
                        [
                            'account_code' => $data['res_act'],
                            'debit' => $row['amount'],
                            'credit' => 0,
                            'memo' => $memo,
                            'dimension' => (int) ($data['dimension_id'] ?? 0) ?: null,
                            'dimension2' => (int) ($data['dimension2_id'] ?? 0) ?: null,
                        ],
                    ],
                ]);
                $journals[] = $result;
            }

            return [
                'journals' => $journals,
                'periods' => count($schedule),
                'message' => 'Revenue / Cost Accruals have been processed.',
            ];
        });
    }

    /**
     * @return array<int, array{date: string, amount: float, acc_act: string, res_act: string}>
     */
    private function buildSchedule(array $data): array
    {
        $periods = max(1, (int) ($data['periods'] ?? 1));
        $freq = (int) ($data['freq'] ?? 3);
        $amount = round((float) $data['amount'], 2);
        if ($amount <= 0) {
            throw new \InvalidArgumentException('The amount cannot be 0.');
        }

        $start = Carbon::parse($data['date'])->startOfDay();
        $this->assertInOpenFiscalYear($start);

        $per = $periods - 1;
        $dateCursor = $start->copy();
        if ($freq === 3 || $freq === 4) {
            $dateCursor = $start->copy()->startOfMonth();
        }

        $lastDate = $this->advanceDate($dateCursor->copy(), $freq, $per);
        $this->assertInOpenFiscalYear($lastDate);

        $am = round($amount / $periods, 2);
        $am0 = ($am * $periods !== $amount) ? round($amount - ($am * ($periods - 1)), 2) : $am;

        $rows = [];
        $cursor = $dateCursor->copy();

        for ($i = 0; $i < $periods; $i++) {
            if ($i > 0) {
                $cursor = $this->advanceDate($cursor, $freq, 1);
                $am0 = $am;
            }

            $postDate = ($freq === 3 || $freq === 4)
                ? $cursor->copy()->endOfMonth()->toDateString()
                : $cursor->toDateString();

            $rows[] = [
                'date' => $postDate,
                'amount' => $am0,
                'acc_act' => $data['acc_act'],
                'res_act' => $data['res_act'],
            ];
        }

        return $rows;
    }

    private function advanceDate(Carbon $date, int $freq, int $steps): Carbon
    {
        $result = $date->copy();
        for ($s = 0; $s < $steps; $s++) {
            $result = match ($freq) {
                1 => $result->addDays(7),
                2 => $result->addDays(14),
                3 => $result->addMonthNoOverflow()->endOfMonth(),
                4 => $result->addMonthsNoOverflow(3)->endOfMonth(),
                default => $result->addMonthNoOverflow()->endOfMonth(),
            };
        }

        return $result;
    }

    private function assertInOpenFiscalYear(Carbon $date): void
    {
        $range = ActiveFiscalYear::range($date->toDateString());
        if (empty($range['fiscal_year_from']) || empty($range['fiscal_year_to'])) {
            throw new \InvalidArgumentException('No open fiscal year for the selected date.');
        }

        $from = Carbon::parse($range['fiscal_year_from']);
        $to = Carbon::parse($range['fiscal_year_to']);

        if ($date->lt($from) || $date->gt($to)) {
            throw new \InvalidArgumentException(
                'The date is outside the fiscal year or closed for further data entry.'
            );
        }
    }
}
