<?php

namespace App\Services\Auth;

use App\Models\UserActivityLog;
use App\Models\UserManagement;
use App\Support\UserActivityPath;
use App\Support\UserActivityRouteMapper;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class UserActivityLogService
{
    public function __construct(
        private IpGeolocationService $geo
    ) {}

    public function recordLogin(
        Request $request,
        bool $success,
        ?int $userId = null,
        ?string $email = null,
        ?string $fullName = null,
        ?string $userRole = null
    ): UserActivityLog {
        $agent = (string) $request->userAgent();
        $parsed = $this->parseUserAgent($agent);
        $geo = $this->geo->lookup($request->ip());

        return UserActivityLog::create([
            'user_id' => $userId,
            'email' => $email,
            'full_name' => $fullName,
            'user_role' => $userRole,
            'activity_type' => $success ? 'login' : 'login_failed',
            'module' => 'Authentication',
            'entity_label' => 'Sign in',
            'description' => $success ? 'User signed in successfully' : 'Failed sign-in attempt',
            'success' => $success,
            'http_status' => $success ? 200 : 422,
            'ip_address' => $request->ip(),
            ...$geo,
            'user_agent' => $agent ?: null,
            'device_summary' => $parsed['summary'],
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'route' => 'login',
            'http_method' => 'POST',
            'occurred_at' => now(),
        ]);
    }

    public function recordBlockedIpLogin(
        Request $request,
        ?string $email = null,
        ?int $userId = null,
        ?string $fullName = null,
        ?string $userRole = null
    ): UserActivityLog {
        $agent = (string) $request->userAgent();
        $parsed = $this->parseUserAgent($agent);
        $geo = $this->geo->lookup($request->ip());

        return UserActivityLog::create([
            'user_id' => $userId,
            'email' => $email,
            'full_name' => $fullName,
            'user_role' => $userRole,
            'activity_type' => 'login_blocked_ip',
            'module' => 'Authentication',
            'entity_label' => 'Blocked login',
            'description' => 'Login blocked — IP address not on allowed list ('.($request->ip() ?: 'unknown').')',
            'success' => false,
            'http_status' => 403,
            'ip_address' => $request->ip(),
            ...$geo,
            'user_agent' => $agent ?: null,
            'device_summary' => $parsed['summary'],
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'route' => 'login',
            'http_method' => 'POST',
            'occurred_at' => now(),
        ]);
    }

    public function recordFromRequest(Request $request, Response $response): void
    {
        $user = $this->resolveAuthenticatedUser($request);
        if (! $user) {
            return;
        }

        $mapped = UserActivityRouteMapper::map($request);
        $agent = (string) $request->userAgent();
        $parsed = $this->parseUserAgent($agent);
        $geo = $this->geo->lookup($request->ip());
        $status = $response->getStatusCode();
        $transactionRef = $this->extractTransactionReference($response);

        $entityId = $mapped['entity_id'] ?? $transactionRef;
        $description = $mapped['description'];
        if ($transactionRef && ! str_contains($description, $transactionRef)) {
            $description = rtrim($description, ')').", ref {$transactionRef})";
        }

        UserActivityLog::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => trim("{$user->first_name} {$user->last_name}"),
            'user_role' => $user->role,
            'activity_type' => $mapped['activity_type'],
            'module' => $mapped['module'],
            'entity_label' => $mapped['entity_label'],
            'entity_id' => $entityId,
            'http_method' => $request->method(),
            'route' => UserActivityPath::relativePath($request),
            'description' => $description,
            'success' => $status >= 200 && $status < 400,
            'http_status' => $status,
            'ip_address' => $request->ip(),
            ...$geo,
            'user_agent' => $agent ?: null,
            'device_summary' => $parsed['summary'],
            'browser' => $parsed['browser'],
            'platform' => $parsed['platform'],
            'metadata' => [
                'query' => $request->query(),
                'transaction_ref' => $transactionRef,
            ],
            'occurred_at' => now(),
        ]);
    }

    public function resolveAuthenticatedUser(Request $request): ?UserManagement
    {
        $user = $request->user();
        if ($user instanceof UserManagement) {
            return $user;
        }

        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($token);
        $tokenable = $accessToken?->tokenable;

        return $tokenable instanceof UserManagement ? $tokenable : null;
    }

    private function extractTransactionReference(Response $response): ?string
    {
        $content = $response->getContent();
        if (! is_string($content) || $content === '') {
            return null;
        }

        $body = json_decode($content, true);
        if (! is_array($body)) {
            return null;
        }

        foreach (['trans_no', 'transNo', 'order_no', 'orderNo', 'batch_id', 'batchId', 'id', 'reference'] as $key) {
            if (isset($body[$key]) && (is_string($body[$key]) || is_numeric($body[$key]))) {
                return (string) $body[$key];
            }
        }

        if (isset($body['data']) && is_array($body['data'])) {
            foreach (['trans_no', 'transNo', 'order_no', 'orderNo', 'batch_id', 'batchId', 'id', 'reference'] as $key) {
                if (isset($body['data'][$key]) && (is_string($body['data'][$key]) || is_numeric($body['data'][$key]))) {
                    return (string) $body['data'][$key];
                }
            }
        }

        return null;
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
