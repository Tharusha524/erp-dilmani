<?php

namespace App\Support;

use App\Exceptions\GlPostingException;

/**
 * Run PostingsService callbacks and surface failures to API callers.
 */
class GlPostingRunner
{
    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return array{result: T, gl_warning: ?string}
     */
    public static function run(callable $callback): array
    {
        try {
            return ['result' => $callback(), 'gl_warning' => null];
        } catch (GlPostingException $e) {
            logger()->warning('GL posting skipped: '.$e->getMessage());

            return ['result' => null, 'gl_warning' => $e->getMessage()];
        } catch (\Throwable $e) {
            logger()->error('GL posting error: '.$e->getMessage(), ['exception' => $e]);

            return ['result' => null, 'gl_warning' => 'GL posting failed: '.$e->getMessage()];
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function mergeWarning(array $payload, ?string $warning): array
    {
        if ($warning !== null && $warning !== '') {
            $payload['gl_warning'] = $warning;
        }

        return $payload;
    }
}
