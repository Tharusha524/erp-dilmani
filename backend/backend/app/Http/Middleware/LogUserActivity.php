<?php

namespace App\Http\Middleware;

use App\Services\Auth\UserActivityLogService;
use App\Support\UserActivityPath;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /** @var list<string> */
    private const SKIP_FIRST_SEGMENTS = [
        'user-login-logs',
        'user-activity-logs',
        'ai-agent',
        'login',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        if ($this->shouldSkip($request)) {
            return $response;
        }

        try {
            app(UserActivityLogService::class)->recordFromRequest($request, $response);
        } catch (\Throwable $e) {
            report($e);
        }

        return $response;
    }

    private function shouldSkip(Request $request): bool
    {
        $path = UserActivityPath::relativePath($request);
        $segments = UserActivityPath::segments($request);
        $first = $segments[0] ?? '';

        if (in_array($first, self::SKIP_FIRST_SEGMENTS, true)) {
            return true;
        }

        if (str_ends_with($path, '/search') || str_contains($path, '/inquiry/')) {
            return true;
        }

        if (str_ends_with($path, '/preview') || str_ends_with($path, '/test')) {
            return true;
        }

        if (in_array($path, ['gl-trans/backfill-missing', 'backups/test'], true)) {
            return true;
        }

        return false;
    }
}
