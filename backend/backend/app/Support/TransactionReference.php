<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;

/**
 * Exact transaction reference matching for GL posting and lookups.
 * Avoids LIKE '%ref%' which incorrectly matches e.g. 002/2026 inside 002/2026-2027.
 */
class TransactionReference
{
    public static function normalize(?string $value): string
    {
        return trim((string) ($value ?? ''));
    }

    public static function equals(?string $left, ?string $right): bool
    {
        $a = self::normalize($left);
        $b = self::normalize($right);

        return $a !== '' && $a === $b;
    }

    public static function applyExact(Builder $query, string $column, string $reference): Builder
    {
        $ref = self::normalize($reference);
        if ($ref === '') {
            return $query->whereRaw('1 = 0');
        }

        return $query->where($column, $ref);
    }
}
