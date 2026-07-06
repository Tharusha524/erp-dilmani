<?php

namespace App\Support;

use Money\Currencies\ISOCurrencies;
use Money\Currency;
use Money\Formatter\DecimalMoneyFormatter;
use Money\Money;
use Money\Parser\DecimalMoneyParser;

/**
 * MoneyPHP wrapper for ERP decimal amounts (LKR, USD, etc.).
 * Avoids float rounding errors in allocations, credit checks, and GL totals.
 */
final class AccountingMoney
{
    private const DEFAULT_CURRENCY = 'LKR';

    private static ?DecimalMoneyParser $parser = null;

    private static ?DecimalMoneyFormatter $formatter = null;

    public static function of(float|int|string $amount, ?string $currency = null): Money
    {
        $code = strtoupper(trim($currency ?: self::DEFAULT_CURRENCY));
        $parser = self::parser();

        return $parser->parse(self::normalizeDecimalString($amount), new Currency($code));
    }

    /**
     * @param  array<int, float|int|string>  $amounts
     */
    public static function sum(array $amounts, ?string $currency = null): Money
    {
        $code = strtoupper(trim($currency ?: self::DEFAULT_CURRENCY));
        $currencyObj = new Currency($code);
        $total = new Money(0, $currencyObj);

        foreach ($amounts as $amount) {
            $total = $total->add(self::of($amount, $code));
        }

        return $total;
    }

    public static function subtract(Money $left, Money $right): Money
    {
        return $left->subtract($right);
    }

    public static function abs(Money $money): Money
    {
        return $money->isNegative() ? $money->negative() : $money;
    }

    /** Database / API decimal with 2 fraction digits. */
    public static function toDecimal(Money $money): float
    {
        return (float) self::formatter()->format($money);
    }

    public static function isPositive(Money $money): bool
    {
        return $money->isPositive();
    }

    public static function greaterThan(Money $left, Money $right): bool
    {
        return $left->greaterThan($right);
    }

    public static function leftToAllocate(Money $total, Money $allocated): float
    {
        $left = self::subtract(self::abs($total), self::abs($allocated));

        return max(0, self::toDecimal($left->isNegative() ? new Money(0, $total->getCurrency()) : $left));
    }

    private static function parser(): DecimalMoneyParser
    {
        return self::$parser ??= new DecimalMoneyParser(new ISOCurrencies());
    }

    private static function formatter(): DecimalMoneyFormatter
    {
        return self::$formatter ??= new DecimalMoneyFormatter(new ISOCurrencies());
    }

    private static function normalizeDecimalString(float|int|string $amount): string
    {
        if (is_string($amount)) {
            $trimmed = trim($amount);

            return $trimmed === '' ? '0' : $trimmed;
        }

        return number_format((float) $amount, 4, '.', '');
    }
}
