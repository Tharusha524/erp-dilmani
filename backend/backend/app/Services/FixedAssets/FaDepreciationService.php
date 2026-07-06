<?php

namespace App\Services\FixedAssets;

use App\Models\FaDepreciationBatch;
use App\Models\FaDepreciationLine;
use App\Models\StockMaster;
use App\Support\CompanySetupSettings;
use App\Support\FaDepreciationSupport;
use App\Support\GlTransHelper;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class FaDepreciationService
{
    public const JOURNAL_TYPE = 0;

    public const FA_MB_FLAG = 4;

    public function preview(string $periodDate): array
    {
        $this->ensureDepreciationTables();

        $period = Carbon::parse($periodDate);
        $periodKey = $period->format('Y-m');
        $periodsPerYear = $this->periodsPerYear();

        $assets = StockMaster::query()
            ->where('mb_flag', self::FA_MB_FLAG)
            ->where('inactive', 0)
            ->orderBy('stock_id')
            ->get();

        $lines = [];
        foreach ($assets as $asset) {
            $line = $this->buildPreviewLine($asset, $period, $periodKey, $periodsPerYear);
            if ($line !== null) {
                $lines[] = $line;
            }
        }

        return [
            'period_date' => $period->toDateString(),
            'period_key' => $periodKey,
            'periods_per_year' => $periodsPerYear,
            'lines' => $lines,
            'total_amount' => round(array_sum(array_column($lines, 'depreciation_amount')), 2),
            'asset_count' => count($lines),
        ];
    }

    public function process(string $periodDate, ?string $reference = null, ?array $stockIds = null): array
    {
        $this->ensureDepreciationTables();

        $preview = $this->preview($periodDate);
        $lines = collect($preview['lines']);

        if ($stockIds !== null && count($stockIds) > 0) {
            $allowed = array_map('strval', $stockIds);
            $lines = $lines->filter(fn ($l) => in_array((string) $l['stock_id'], $allowed, true));
        }

        $lines = $lines->filter(fn ($l) => ! $l['already_posted'] && (float) $l['depreciation_amount'] > 0);

        if ($lines->isEmpty()) {
            return [
                'message' => 'No assets to depreciate for this period.',
                'batch' => null,
                'lines' => [],
            ];
        }

        $period = Carbon::parse($periodDate);
        $periodKey = $period->format('Y-m');
        $ref = $reference ?: $this->nextReference($period);

        return DB::transaction(function () use ($lines, $period, $periodKey, $ref) {
            $batch = FaDepreciationBatch::create([
                'reference' => $ref,
                'period_date' => $period->toDateString(),
                'assets_count' => $lines->count(),
                'total_amount' => round($lines->sum('depreciation_amount'), 2),
            ]);

            $nextTransNo = $this->nextJournalTransNo();
            $processed = [];

            foreach ($lines as $row) {
                if (empty($row['expense_account']) || empty($row['accumulated_account'])) {
                    throw new InvalidArgumentException(
                        "Asset {$row['stock_id']} is missing depreciation GL accounts. "
                        .'Set Depreciation expense (COGS) and Accumulated depreciation (Adjustment) on the fixed asset item.'
                    );
                }

                $transNo = $nextTransNo++;
                $amount = round((float) $row['depreciation_amount'], 2);

                FaDepreciationLine::create([
                    'batch_id' => $batch->id,
                    'stock_id' => $row['stock_id'],
                    'trans_no' => $transNo,
                    'tran_date' => $period->toDateString(),
                    'amount' => $amount,
                    'expense_account' => $row['expense_account'],
                    'accumulated_account' => $row['accumulated_account'],
                    'period_key' => $periodKey,
                ]);

                $this->insertJournalHeader([
                    'type' => self::JOURNAL_TYPE,
                    'trans_no' => $transNo,
                    'tran_date' => $period->toDateString(),
                    'reference' => $ref,
                    'amount' => $amount,
                    'rate' => 1,
                ]);

                $this->postGlPair(
                    $ref,
                    $period->toDateString(),
                    self::JOURNAL_TYPE,
                    $transNo,
                    $row['expense_account'],
                    $row['accumulated_account'],
                    $amount,
                    $row['description']
                );

                if (Schema::hasColumn('stock_master', 'depreciation_date')) {
                    StockMaster::where('stock_id', $row['stock_id'])->update([
                        'depreciation_date' => $period->toDateString(),
                    ]);
                }

                $processed[] = array_merge($row, [
                    'trans_no' => $transNo,
                    'batch_id' => $batch->id,
                ]);
            }

            return [
                'message' => 'Depreciation processed successfully.',
                'batch' => $batch->fresh(),
                'lines' => $processed,
                'reference' => $ref,
                'total_amount' => $batch->total_amount,
            ];
        });
    }

    /**
     * Create FA depreciation tables when migrations were not run (no artisan migrate).
     */
    private function ensureDepreciationTables(): void
    {
        if (! Schema::hasTable('fa_depreciation_batches')) {
            Schema::create('fa_depreciation_batches', function (Blueprint $table) {
                $table->id();
                $table->string('reference', 60);
                $table->date('period_date');
                $table->unsignedInteger('assets_count')->default(0);
                $table->double('total_amount')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('fa_depreciation_lines')) {
            Schema::create('fa_depreciation_lines', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('batch_id')->index();
                $table->string('stock_id', 20)->index();
                $table->unsignedInteger('trans_no');
                $table->date('tran_date');
                $table->double('amount');
                $table->string('expense_account', 15);
                $table->string('accumulated_account', 15);
                $table->string('period_key', 20);
                $table->timestamps();
                $table->unique(['stock_id', 'period_key']);
            });
        }
    }

    private function buildPreviewLine(StockMaster $asset, Carbon $period, string $periodKey, int $periodsPerYear): ?array
    {
        $start = null;
        if (Schema::hasColumn('stock_master', 'depreciation_start') && $asset->depreciation_start) {
            $start = Carbon::parse($asset->depreciation_start);
            if ($start->gt($period)) {
                return null;
            }
        }

        $assetCost = (float) $asset->purchase_cost;
        if ($assetCost <= 0.001) {
            $assetCost = (float) $asset->material_cost;
        }
        if ($assetCost <= 0) {
            return null;
        }

        $salvage = Schema::hasColumn('stock_master', 'salvage_value')
            ? (float) ($asset->salvage_value ?? 0)
            : 0;
        $usefulLifeYears = Schema::hasColumn('stock_master', 'useful_life_years')
            ? (int) ($asset->useful_life_years ?? 0)
            : 0;

        $accumulated = $this->accumulatedDepreciation($asset->stock_id);
        $remainingDepreciable = FaDepreciationSupport::remainingDepreciable($assetCost, $salvage, $accumulated);
        $bookValue = max($salvage, round($assetCost - $accumulated, 2));

        if ($remainingDepreciable <= 0.001) {
            return null;
        }

        $alreadyPosted = $this->alreadyPostedForPeriod($asset->stock_id, $periodKey);

        $method = FaDepreciationSupport::resolveMethodCode($asset->depreciation_method);
        $rate = (float) $asset->depreciation_rate;
        $factor = (float) ($asset->depreciation_factor ?: 1);

        $amount = $this->calculateDepreciation(
            $method,
            $assetCost,
            $bookValue,
            $accumulated,
            $rate,
            $factor,
            $periodsPerYear,
            $salvage,
            $usefulLifeYears
        );

        if ($alreadyPosted) {
            $amount = 0;
        }

        $amount = round(min($amount, $remainingDepreciable), 2);

        $lastDep = null;
        if (Schema::hasColumn('stock_master', 'depreciation_date') && $asset->depreciation_date) {
            $lastDep = Carbon::parse($asset->depreciation_date)->toDateString();
        }

        return [
            'stock_id' => $asset->stock_id,
            'description' => $asset->description,
            'depreciation_method' => $method,
            'depreciation_rate' => $rate,
            'salvage_value' => round($salvage, 2),
            'useful_life_years' => $usefulLifeYears,
            'asset_cost' => round($assetCost, 2),
            'accumulated_depreciation' => round($accumulated, 2),
            'book_value' => round($bookValue, 2),
            'remaining_depreciable' => round($remainingDepreciable, 2),
            'depreciation_amount' => $amount,
            'expense_account' => (string) ($asset->cogs_account ?? ''),
            'accumulated_account' => (string) ($asset->adjustment_account ?? ''),
            'asset_account' => (string) ($asset->inventory_account ?? ''),
            'depreciation_start' => $start?->toDateString(),
            'last_depreciation_date' => $lastDep,
            'already_posted' => $alreadyPosted,
            'selected' => ! $alreadyPosted && $amount > 0,
        ];
    }

    private function accumulatedDepreciation(string $stockId): float
    {
        if (! Schema::hasTable('fa_depreciation_lines')) {
            return 0;
        }

        return (float) FaDepreciationLine::query()->where('stock_id', $stockId)->sum('amount');
    }

    private function alreadyPostedForPeriod(string $stockId, string $periodKey): bool
    {
        if (! Schema::hasTable('fa_depreciation_lines')) {
            return false;
        }

        return FaDepreciationLine::query()
            ->where('stock_id', $stockId)
            ->where('period_key', $periodKey)
            ->exists();
    }

    private function calculateDepreciation(
        string $method,
        float $assetCost,
        float $bookValue,
        float $accumulated,
        float $rate,
        float $factor,
        int $periodsPerYear,
        float $salvage = 0,
        int $usefulLifeYears = 0
    ): float {
        if ($periodsPerYear <= 0) {
            $periodsPerYear = 12;
        }

        $remaining = FaDepreciationSupport::remainingDepreciable($assetCost, $salvage, $accumulated);

        return match ($method) {
            'D' => min($remaining, $bookValue * ($rate / 100) * $factor / $periodsPerYear),
            'O' => $remaining,
            'N' => min(
                $remaining,
                $this->sumOfYearsDigit(
                    FaDepreciationSupport::depreciableAmount($assetCost, $salvage),
                    $accumulated,
                    $usefulLifeYears > 0 ? $usefulLifeYears : (int) max(1, round(100 / max($rate, 1)))
                )
            ),
            default => $usefulLifeYears > 0
                ? FaDepreciationSupport::straightLinePeriod($assetCost, $salvage, $usefulLifeYears, $periodsPerYear)
                : min($remaining, $assetCost * ($rate / 100) / $periodsPerYear),
        };
    }

    private function sumOfYearsDigit(float $cost, float $accumulated, int $lifeYears): float
    {
        if ($lifeYears <= 0) {
            return 0;
        }
        $remainingYears = max(1, $lifeYears - (int) floor($accumulated / max($cost / $lifeYears, 1)));
        $sumDigits = ($lifeYears * ($lifeYears + 1)) / 2;
        if ($sumDigits <= 0) {
            return 0;
        }

        return ($cost * $remainingYears) / $sumDigits / 12;
    }

    private function periodsPerYear(): int
    {
        if (! Schema::hasTable('sys_prefs')) {
            return 12;
        }

        $pref = DB::table('sys_prefs')->where('name', 'depreciationPeriod')->value('value');
        if ((string) $pref === '2') {
            return 1;
        }

        return 12;
    }

    private function nextReference(Carbon $period): string
    {
        $year = $period->year;
        $existing = FaDepreciationBatch::query()
            ->where('reference', 'like', "%/{$year}")
            ->pluck('reference')
            ->map(function ($ref) {
                if (preg_match('/^(\d+)\//', (string) $ref, $m)) {
                    return (int) $m[1];
                }

                return 0;
            });

        $next = $existing->isEmpty() ? 1 : $existing->max() + 1;

        return str_pad((string) $next, 3, '0', STR_PAD_LEFT).'/'.$year;
    }

    private function nextJournalTransNo(): int
    {
        $maxLine = Schema::hasTable('fa_depreciation_lines')
            ? (int) FaDepreciationLine::max('trans_no')
            : 0;
        $maxJournal = Schema::hasTable('journal')
            ? (int) DB::table('journal')->where('type', self::JOURNAL_TYPE)->max('trans_no')
            : 0;

        return max($maxLine, $maxJournal, 0) + 1;
    }

    /**
     * @param  array{type:int,trans_no:int,tran_date:string,reference:string,amount:float,rate?:float,currency?:string}  $row
     */
    private function insertJournalHeader(array $row): void
    {
        if (! Schema::hasTable('journal')) {
            return;
        }

        $tranDate = $row['tran_date'];
        $payload = [
            'type' => $row['type'],
            'trans_no' => $row['trans_no'],
            'tran_date' => $tranDate,
            'reference' => $row['reference'] ?? '',
            'amount' => $row['amount'] ?? 0,
            'rate' => $row['rate'] ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::hasColumn('journal', 'source_ref')) {
            $payload['source_ref'] = $row['source_ref'] ?? '';
        }
        if (Schema::hasColumn('journal', 'event_date')) {
            $payload['event_date'] = $row['event_date'] ?? $tranDate;
        }
        if (Schema::hasColumn('journal', 'doc_date')) {
            $payload['doc_date'] = $row['doc_date'] ?? $tranDate;
        }
        if (Schema::hasColumn('journal', 'currency')) {
            $payload['currency'] = $row['currency'] ?? $this->resolveCurrency(null);
        }

        try {
            DB::table('journal')->insert($payload);
        } catch (\Throwable $e) {
            throw new InvalidArgumentException(
                'Could not save journal header for depreciation. '
                .'Check that the home currency exists and journal type 0 is configured in reference lines.',
                previous: $e
            );
        }
    }

    private function resolveCurrency(?string $currency): string
    {
        $candidate = strtoupper(trim((string) ($currency ?? '')));

        if ($candidate !== '' && Schema::hasTable('currencies')) {
            $exists = DB::table('currencies')
                ->where('currency_abbreviation', $candidate)
                ->exists();
            if ($exists) {
                return $candidate;
            }
        }

        $home = CompanySetupSettings::current()?->homeCurrency?->currency_abbreviation;
        if ($home && Schema::hasTable('currencies')) {
            $home = strtoupper(trim((string) $home));
            $exists = DB::table('currencies')
                ->where('currency_abbreviation', $home)
                ->exists();
            if ($exists) {
                return $home;
            }
        }

        if (Schema::hasTable('currencies')) {
            $fallback = DB::table('currencies')->value('currency_abbreviation');
            if ($fallback) {
                return strtoupper((string) $fallback);
            }
        }

        return 'USD';
    }

    private function postGlPair(
        string $reference,
        string $date,
        int $type,
        int $transNo,
        string $expenseAccount,
        string $accumulatedAccount,
        float $amount,
        string $memo
    ): void {
        if ($amount <= 0 || ! $expenseAccount || ! $accumulatedAccount) {
            return;
        }

        $typeLabel = (string) $type;
        if (GlTransHelper::hasMemoPrefix($type, $transNo, 'Depreciation expense: '.$memo)) {
            return;
        }

        GlTransHelper::insertLines([
            [
                'type' => $typeLabel,
                'type_no' => $transNo,
                'reference' => $reference,
                'date' => $date,
                'account' => $expenseAccount,
                'debit' => $amount,
                'credit' => 0,
                'memo' => 'Depreciation expense: '.$memo,
            ],
            [
                'type' => $typeLabel,
                'type_no' => $transNo,
                'reference' => $reference,
                'date' => $date,
                'account' => $accumulatedAccount,
                'debit' => 0,
                'credit' => $amount,
                'memo' => 'Accumulated depreciation: '.$memo,
            ],
        ]);
    }
}
