<?php

namespace App\Services\FixedAssets;

use App\Models\FixedAssetsLocation;
use App\Models\InventoryLocation;
use Illuminate\Support\Facades\Schema;

/**
 * Ensures fixed-asset location codes exist in inventory_locations (required by stock_moves FK).
 */
class FaLocationSyncService
{
    public function ensureInventoryLocation(string $locCode, ?string $locationName = null): string
    {
        $code = strtoupper(trim($locCode));
        if ($code === '') {
            throw new \InvalidArgumentException('Location code is required.');
        }

        if (! Schema::hasTable('inventory_locations')) {
            throw new \InvalidArgumentException('Inventory locations table is not available.');
        }

        $existing = InventoryLocation::query()->where('loc_code', $code)->first();
        if ($existing) {
            return $code;
        }

        $name = trim((string) ($locationName ?? ''));
        if ($name === '' && Schema::hasTable('fixed_assets_locations')) {
            $fa = FixedAssetsLocation::query()->where('locationCode', $code)->first();
            $name = $fa?->locationName ?? $code;
        }
        if ($name === '') {
            $name = $code;
        }

        InventoryLocation::query()->create([
            'loc_code' => $code,
            'location_name' => mb_substr($name, 0, 60),
            'contact' => '',
            'delivery_address' => '',
            'phone' => '',
            'phone2' => '',
            'fax' => '',
            'email' => '',
            'inactive' => false,
        ]);

        return $code;
    }

    public function syncFromFaRecord(FixedAssetsLocation $location): void
    {
        $this->ensureInventoryLocation(
            (string) $location->locationCode,
            (string) $location->locationName
        );
    }

    /**
     * @param  array{locationCode?:string,locationName?:string,loc_code?:string,location_name?:string}  $data
     */
    public function syncFromArray(array $data): void
    {
        $code = trim((string) ($data['locationCode'] ?? $data['loc_code'] ?? ''));
        if ($code === '') {
            return;
        }

        $this->ensureInventoryLocation(
            $code,
            (string) ($data['locationName'] ?? $data['location_name'] ?? $code)
        );
    }
}
