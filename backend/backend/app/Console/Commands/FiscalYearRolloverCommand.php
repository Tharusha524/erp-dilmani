<?php

namespace App\Console\Commands;

use App\Services\FiscalYear\FiscalYearRolloverService;
use Illuminate\Console\Command;

class FiscalYearRolloverCommand extends Command
{
    protected $signature = 'fiscal-year:rollover {--date= : Process rollovers as of this date (Y-m-d)}';

    protected $description = 'Close ended fiscal years and automatically open the next fiscal year';

    public function handle(FiscalYearRolloverService $service): int
    {
        $asOf = $this->option('date');
        $results = $service->processDueRollovers(is_string($asOf) && $asOf !== '' ? $asOf : null);

        if ($results === []) {
            $this->info('No fiscal years due for rollover.');

            return self::SUCCESS;
        }

        foreach ($results as $result) {
            if (($result['status'] ?? '') === 'rolled_over') {
                $this->info(sprintf(
                    'Closed FY %s to %s -> opened %s to %s (new id %s)',
                    $result['closed_from'] ?? '?',
                    $result['closed_to'] ?? '?',
                    $result['new_fiscal_year_from'] ?? '?',
                    $result['new_fiscal_year_to'] ?? '?',
                    $result['new_fiscal_year_id'] ?? '?'
                ));
            } else {
                $this->warn($result['message'] ?? 'Skipped fiscal year rollover.');
            }
        }

        return self::SUCCESS;
    }
}
