<?php

namespace App\Http\Middleware;

use App\Services\Auth\LoginActivityService;
use App\Services\Auth\LoginIpRestrictionService;
use App\Support\UserActivityPath;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAllowedLoginIp
{
    public function handle(Request $request, Closure $next): Response
    {
        $service = app(LoginIpRestrictionService::class);

        if (! $service->isEnabled()) {
            return $next($request);
        }

        $path = UserActivityPath::relativePath($request);
        if ($path === 'login-ip-settings' || str_starts_with($path, 'login-ip-settings/')) {
            return $next($request);
        }

        $ip = $request->ip();
        if ($service->isIpAllowed($ip)) {
            return $next($request);
        }

        if ($path === 'login') {
            try {
                app(LoginActivityService::class)->recordBlockedIp(
                    $request,
                    (string) $request->input('email', '')
                );
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Access from your IP address ('.($ip ?: 'unknown').') is not permitted. Contact your administrator.',
        ], 403);
    }
}
