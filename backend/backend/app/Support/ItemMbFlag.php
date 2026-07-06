<?php

namespace App\Support;

/**
 * item_type.id values (see ItemTypeSeeder).
 */
final class ItemMbFlag
{
    public const MANUFACTURED = 1;

    public const PURCHASED = 2;

    public const SERVICE = 3;

    public const FIXED_ASSET = 4;

    public const DUMMY = 0;

    public static function isPurchasedOrService(int $mbFlag): bool
    {
        return in_array($mbFlag, [self::PURCHASED, self::SERVICE, self::DUMMY], true);
    }
}
