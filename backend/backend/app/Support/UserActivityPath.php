<?php

namespace App\Support;

use Illuminate\Http\Request;

class UserActivityPath
{
    /**
     * @return list<string>
     */
    public static function segments(Request $request): array
    {
        $path = trim($request->path(), '/');
        $segments = $path === '' ? [] : explode('/', $path);

        if (($segments[0] ?? '') === 'api') {
            array_shift($segments);
        }

        return $segments;
    }

    public static function relativePath(Request $request): string
    {
        return implode('/', self::segments($request));
    }
}
