<?php

namespace App\Console\Commands;

use App\Services\Monitoring\LowStockAlertService;
use Illuminate\Console\Command;

class LowStockAlertCommand extends Command
{
    protected $signature = 'supermarket:low-stock-alert';

    protected $description = '24/7 Business Monitoring: SMS the business owner when stock is critically low or out of stock';

    public function handle(LowStockAlertService $service): int
    {
        $result = $service->checkAndAlert();

        if ($result['critical_count'] === 0 && $result['low_count'] === 0) {
            $this->info('No low or out-of-stock items — nothing to alert.');

            return self::SUCCESS;
        }

        if ($result['alerted']) {
            $this->info(sprintf(
                'Alert sent — %d critical, %d low stock item(s).',
                $result['critical_count'],
                $result['low_count']
            ));
        } else {
            $this->warn(sprintf(
                'Found %d critical, %d low stock item(s) but could not send the alert: %s',
                $result['critical_count'],
                $result['low_count'],
                $result['delivery']['message'] ?? 'no recipient phone number configured'
            ));
        }

        return self::SUCCESS;
    }
}
