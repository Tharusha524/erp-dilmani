<?php

namespace App\Services\Monitoring;

use App\Models\CompanySetup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * 24/7 Business Monitoring — automatically alerts the business owner by SMS
 * when stock goes critically low or out of stock, so they don't have to log
 * in and check manually. Reuses the exact same real Notify.lk SMS gateway
 * already integrated for Win-Back Campaigns — same provider, same config,
 * just a separate, small copy of the send logic here so this new feature
 * can never accidentally affect the already-verified Win-Back flow.
 *
 * Pure reporting + a notification — no writes to stock, no accounting
 * entries, nothing GL-related. Intended to run on a schedule (see
 * routes/console.php); a genuinely "critical" state (0 or below reorder
 * level) is only worth alerting on once a day, not on every request.
 */
class LowStockAlertService
{
    /**
     * @return array{alerted: bool, critical_count: int, low_count: int, delivery?: array}
     */
    public function checkAndAlert(): array
    {
        $rows = DB::table('loc_stock as ls')
            ->join('stock_master as sm', 'sm.stock_id', '=', 'ls.stock_id')
            ->select('ls.stock_id', 'sm.description', 'ls.quantity', 'ls.reorder_level')
            ->whereNotNull('ls.reorder_level')
            ->whereColumn('ls.quantity', '<=', 'ls.reorder_level')
            ->where('sm.inactive', false)
            ->get();

        $critical = $rows->filter(fn ($r) => (float) $r->quantity <= 0);
        $low = $rows->filter(fn ($r) => (float) $r->quantity > 0);

        if ($rows->isEmpty()) {
            return ['alerted' => false, 'critical_count' => 0, 'low_count' => 0];
        }

        $company = CompanySetup::query()->first();
        $phone = $company?->phone_number;

        if (empty($phone)) {
            Log::warning('Low stock alert not sent — no phone number set in Company Setup');

            return ['alerted' => false, 'critical_count' => $critical->count(), 'low_count' => $low->count()];
        }

        $message = $this->buildMessage($company?->name, $critical, $low);
        $delivery = $this->sendSms($phone, $message);

        return [
            'alerted' => $delivery['sent'],
            'critical_count' => $critical->count(),
            'low_count' => $low->count(),
            'delivery' => $delivery,
        ];
    }

    private function buildMessage(?string $shopName, $critical, $low): string
    {
        $shop = $shopName ?: 'Your shop';
        $parts = [];

        if ($critical->count() > 0) {
            $names = $critical->take(3)->pluck('description')->implode(', ');
            $parts[] = "{$critical->count()} item(s) OUT OF STOCK ({$names}" . ($critical->count() > 3 ? ', ...' : '') . ')';
        }
        if ($low->count() > 0) {
            $names = $low->take(3)->pluck('description')->implode(', ');
            $parts[] = "{$low->count()} item(s) LOW ({$names}" . ($low->count() > 3 ? ', ...' : '') . ')';
        }

        return "{$shop} stock alert: " . implode('. ', $parts) . '.';
    }

    /**
     * @return array{sent: bool, provider: string, message?: string}
     */
    private function sendSms(string $mobile, string $message): array
    {
        $userId = config('services.notifylk.user_id');
        $apiKey = config('services.notifylk.api_key');
        $senderId = config('services.notifylk.sender_id');

        if (empty($userId) || empty($apiKey)) {
            Log::warning('Low stock alert SMS not sent — Notify.lk credentials are not configured');

            return ['sent' => false, 'provider' => 'notifylk', 'message' => 'Notify.lk credentials not configured in .env'];
        }

        $to = $this->toSriLankanInternationalFormat($mobile);

        try {
            $response = Http::timeout(15)->get('https://app.notify.lk/api/v1/send', [
                'user_id' => $userId,
                'api_key' => $apiKey,
                'sender_id' => $senderId,
                'to' => $to,
                'message' => $message,
            ]);

            $body = $response->json();
            $status = $body['status'] ?? null;

            if ($response->successful() && $status === 'success') {
                Log::info('Low stock alert SMS sent via Notify.lk', ['to' => $to]);

                return ['sent' => true, 'provider' => 'notifylk'];
            }

            Log::warning('Low stock alert SMS failed', ['to' => $to, 'response' => $body]);

            return ['sent' => false, 'provider' => 'notifylk', 'message' => $body['message'] ?? 'Notify.lk rejected the request'];
        } catch (\Throwable $e) {
            Log::error('Low stock alert SMS threw an exception', ['error' => $e->getMessage()]);

            return ['sent' => false, 'provider' => 'notifylk', 'message' => 'Could not reach Notify.lk'];
        }
    }

    private function toSriLankanInternationalFormat(string $mobile): string
    {
        $digits = preg_replace('/\D+/', '', $mobile);

        if (str_starts_with($digits, '94')) {
            return $digits;
        }
        if (str_starts_with($digits, '0')) {
            return '94' . substr($digits, 1);
        }

        return '94' . $digits;
    }
}
