<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class ShipViaResolver
{
    public static function resolve(mixed $payloadShipVia, mixed $fallbackShipVia = null): ?int
    {
        $candidate = (int) ($payloadShipVia ?? $fallbackShipVia ?? 0);
        if ($candidate <= 0) {
            return null;
        }

        if (Schema::hasTable('shipping_companies')) {
            $exists = DB::table('shipping_companies')->where('shipper_id', $candidate)->exists();
            if (! $exists) {
                return null;
            }
        }

        return $candidate;
    }
}
