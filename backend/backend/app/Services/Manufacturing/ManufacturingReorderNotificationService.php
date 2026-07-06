<?php

namespace App\Services\Manufacturing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * FrontAccounting send_reorder_email() parity — triggered after WO production consumes components.
 */
class ManufacturingReorderNotificationService
{
    /**
     * @param  array<int, array{stock_id:string, loc_code:string, quantity:float}>  $consumptions
     */
    public function notifyAfterProduction(array $consumptions): void
    {
        if ($consumptions === [] || ! $this->isEnabled()) {
            return;
        }

        $byLocation = [];

        foreach ($consumptions as $row) {
            $stockId = trim((string) ($row['stock_id'] ?? ''));
            $locCode = strtoupper(trim((string) ($row['loc_code'] ?? '')));
            if ($stockId === '' || $locCode === '') {
                continue;
            }

            if (! $this->isInventoryItem($stockId)) {
                continue;
            }

            $reorder = $this->reorderLevel($stockId, $locCode);
            if ($reorder <= 0) {
                continue;
            }

            $qoh = $this->quantityOnHand($stockId, $locCode);
            if ($qoh >= $reorder) {
                continue;
            }

            $description = (string) DB::table('stock_master')->where('stock_id', $stockId)->value('description');
            $byLocation[$locCode]['items'][] = [
                'stock_id' => $stockId,
                'description' => $description,
                'reorder_level' => $reorder,
                'below_by' => round($reorder - $qoh, 4),
                'qoh' => $qoh,
            ];
        }

        foreach ($byLocation as $locCode => $data) {
            $this->sendLocationEmail($locCode, $data['items'] ?? []);
        }
    }

    private function isEnabled(): bool
    {
        if (! Schema::hasTable('sys_prefs')) {
            return false;
        }

        foreach (['locationNotification', 'loc_notification'] as $name) {
            $value = DB::table('sys_prefs')->where('name', $name)->value('value');
            if ($value === null) {
                continue;
            }
            $normalized = strtolower(trim((string) $value));

            return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
        }

        return false;
    }

    private function isInventoryItem(string $stockId): bool
    {
        if (! Schema::hasTable('stock_master')) {
            return false;
        }

        $mbFlag = (int) DB::table('stock_master')->where('stock_id', $stockId)->value('mb_flag');

        return ! in_array($mbFlag, [3, 4], true);
    }

    private function reorderLevel(string $stockId, string $locCode): float
    {
        if (! Schema::hasTable('loc_stock')) {
            return 0.0;
        }

        return (float) DB::table('loc_stock')
            ->where('stock_id', $stockId)
            ->where('loc_code', $locCode)
            ->value('reorder_level');
    }

    private function quantityOnHand(string $stockId, string $locCode): float
    {
        if (Schema::hasTable('loc_stock') && Schema::hasColumn('loc_stock', 'quantity')) {
            return (float) DB::table('loc_stock')
                ->where('stock_id', $stockId)
                ->where('loc_code', $locCode)
                ->value('quantity');
        }

        if (! Schema::hasTable('stock_moves')) {
            return 0.0;
        }

        return (float) DB::table('stock_moves')
            ->where('stock_id', $stockId)
            ->where('loc_code', $locCode)
            ->sum('qty');
    }

    /**
     * @param  array<int, array{stock_id:string, description:string, reorder_level:float, below_by:float, qoh:float}>  $items
     */
    private function sendLocationEmail(string $locCode, array $items): void
    {
        if ($items === [] || ! Schema::hasTable('inventory_locations')) {
            return;
        }

        $location = DB::table('inventory_locations')->where('loc_code', $locCode)->first();
        if (! $location) {
            return;
        }

        $email = trim((string) ($location->email ?? ''));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Manufacturing reorder notification skipped: no email for location '.$locCode);

            return;
        }

        $locationName = (string) ($location->location_name ?? $locCode);
        $company = (string) (DB::table('company_setup')->value('name') ?? config('app.name', 'ERP'));

        $lines = ["Stocks below Re-Order Level at {$locationName}", ''];
        foreach ($items as $item) {
            $lines[] = sprintf(
                '%s %s, Re-Order Level: %s, Below: %s',
                $item['stock_id'],
                $item['description'],
                $item['reorder_level'],
                $item['below_by']
            );
        }
        $lines[] = '';
        $lines[] = 'Please reorder';
        $lines[] = '';
        $lines[] = $company;

        $body = implode("\n", $lines);
        $subject = "Stocks below Re-Order Level at {$locationName}";

        try {
            Mail::raw($body, function ($message) use ($email, $subject, $locationName) {
                $message->to($email, $locationName)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Manufacturing reorder email failed for '.$locCode.': '.$e->getMessage());
        }
    }
}
