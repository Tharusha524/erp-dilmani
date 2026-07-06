<?php

namespace App\Services\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LoginThrottleService
{
    public function isLocked(Request $request, string $email): bool
    {
        $lockedUntil = Cache::get($this->lockKey($request, $email));

        if (! $lockedUntil) {
            return false;
        }

        if (now()->timestamp >= (int) $lockedUntil) {
            $this->clear($request, $email);

            return false;
        }

        return true;
    }

    public function secondsUntilUnlock(Request $request, string $email): int
    {
        $lockedUntil = (int) Cache::get($this->lockKey($request, $email), 0);

        return max(0, $lockedUntil - now()->timestamp);
    }

    public function increment(Request $request, string $email): void
    {
        $attemptKey = $this->attemptKey($request, $email);
        $attempts = ((int) Cache::get($attemptKey, 0)) + 1;
        $expiresAt = now()->addMinutes($this->lockoutMinutes());

        Cache::put($attemptKey, $attempts, $expiresAt);

        if ($attempts >= $this->maxAttempts()) {
            Cache::put($this->lockKey($request, $email), $expiresAt->timestamp, $expiresAt);
        }
    }

    public function clear(Request $request, string $email): void
    {
        Cache::forget($this->attemptKey($request, $email));
        Cache::forget($this->lockKey($request, $email));
    }

    private function attemptKey(Request $request, string $email): string
    {
        return 'login_attempts:'.hash('sha256', strtolower(trim($email)).'|'.$request->ip());
    }

    private function lockKey(Request $request, string $email): string
    {
        return 'login_locked_until:'.hash('sha256', strtolower(trim($email)).'|'.$request->ip());
    }

    private function maxAttempts(): int
    {
        return max(1, (int) config('security.login.max_attempts', 5));
    }

    private function lockoutMinutes(): int
    {
        return max(1, (int) config('security.login.lockout_minutes', 15));
    }
}
