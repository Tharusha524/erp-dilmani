<?php

namespace App\Services\Auth;

use App\Models\UserLoginLog;
use Illuminate\Http\Request;

class LoginActivityService
{
    public function __construct(
        private IpGeolocationService $geo,
        private UserActivityLogService $activityLog
    ) {}

    public function record(
        Request $request,
        bool $success,
        ?int $userId = null,
        ?string $email = null,
        ?string $fullName = null,
        ?string $userRole = null
    ): void {
        $agent = (string) $request->userAgent();
        $parsed = $this->parseUserAgent($agent);
        $geo = $this->geo->lookup($request->ip());

        $loginLog = UserLoginLog::create([
            'user_id' => $userId,
            'email' => $email,
            'full_name' => $fullName,
            'user_role' => $userRole,
            'ip_address' => $request->ip(),
            ...$geo,
            'user_agent' => $agent ?: null,
            'device_summary' => $parsed['summary'],
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'success' => $success,
            'logged_in_at' => now(),
        ]);

        try {
            $this->activityLog->recordLogin(
                $request,
                $success,
                $userId,
                $email,
                $fullName,
                $userRole
            );
        } catch (\Throwable $e) {
            report($e);
            app(LoginActivitySyncService::class)->syncLoginLog($loginLog);
        }
    }

    public function recordBlockedIp(
        Request $request,
        ?string $email = null,
        ?int $userId = null,
        ?string $fullName = null,
        ?string $userRole = null
    ): void {
        $agent = (string) $request->userAgent();
        $parsed = $this->parseUserAgent($agent);
        $geo = $this->geo->lookup($request->ip());

        UserLoginLog::create([
            'user_id' => $userId,
            'email' => $email,
            'full_name' => $fullName,
            'user_role' => $userRole,
            'ip_address' => $request->ip(),
            ...$geo,
            'user_agent' => $agent ?: null,
            'device_summary' => $parsed['summary'],
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'success' => false,
            'logged_in_at' => now(),
        ]);

        $this->activityLog->recordBlockedIpLogin($request, $email, $userId, $fullName, $userRole);
    }

    /**
     * @return array{summary: string, browser: string, platform: string}
     */
    private function parseUserAgent(string $agent): array
    {
        if ($agent === '') {
            return ['summary' => 'Unknown', 'browser' => 'Unknown', 'platform' => 'Unknown'];
        }

        $browser = 'Unknown';
        if (str_contains($agent, 'Edg/')) {
            $browser = 'Edge';
        } elseif (str_contains($agent, 'Chrome/')) {
            $browser = 'Chrome';
        } elseif (str_contains($agent, 'Firefox/')) {
            $browser = 'Firefox';
        } elseif (str_contains($agent, 'Safari/') && ! str_contains($agent, 'Chrome/')) {
            $browser = 'Safari';
        }

        $platform = 'Unknown';
        if (str_contains($agent, 'Windows')) {
            $platform = 'Windows';
        } elseif (str_contains($agent, 'Mac OS')) {
            $platform = 'macOS';
        } elseif (str_contains($agent, 'Android')) {
            $platform = 'Android';
        } elseif (str_contains($agent, 'iPhone') || str_contains($agent, 'iPad')) {
            $platform = 'iOS';
        } elseif (str_contains($agent, 'Linux')) {
            $platform = 'Linux';
        }

        return [
            'summary' => trim("{$browser} on {$platform}"),
            'browser' => $browser,
            'platform' => $platform,
        ];
    }
}
