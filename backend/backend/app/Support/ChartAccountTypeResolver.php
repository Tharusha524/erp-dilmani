<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Chart of accounts is the single source of truth for account_type (chart_types.id).
 */
class ChartAccountTypeResolver
{
    /** @var array<string, int>|null */
    private static ?array $typeByCode = null;

    public static function typeForCode(string $accountCode): int
    {
        $code = trim($accountCode);
        if ($code === '') {
            return 0;
        }

        $map = self::typesByCode();

        return (int) ($map[$code] ?? 0);
    }

    /**
     * @return array<string, int> account_code => account_type
     */
    public static function typesByCode(): array
    {
        if (self::$typeByCode !== null) {
            return self::$typeByCode;
        }

        if (! Schema::hasTable('chart_master')) {
            self::$typeByCode = [];

            return self::$typeByCode;
        }

        self::$typeByCode = DB::table('chart_master')
            ->select('account_code', 'account_type')
            ->get()
            ->mapWithKeys(function ($row) {
                $code = trim((string) $row->account_code);

                return $code === '' ? [] : [$code => (int) $row->account_type];
            })
            ->all();

        // Also index without leading zeros mismatches (1000 vs 01000).
        foreach (array_keys(self::$typeByCode) as $code) {
            $normalized = ltrim($code, '0');
            if ($normalized !== '' && $normalized !== $code && ! isset(self::$typeByCode[$normalized])) {
                self::$typeByCode[$normalized] = self::$typeByCode[$code];
            }
        }

        return self::$typeByCode;
    }

    public static function clearCache(): void
    {
        self::$typeByCode = null;
    }
}
