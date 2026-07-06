<?php

namespace App\Services\Auth;

use App\Models\UserActivityLog;
use App\Models\UserLoginLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class LoginActivitySyncService
{
    /**
     * Ensure every user_login_logs row has a matching user_activity_logs login entry.
     */
    public function backfillAll(): int
    {
        $created = 0;

        UserLoginLog::query()->orderBy('id')->chunkById(200, function ($rows) use (&$created) {
            foreach ($rows as $login) {
                if ($this->syncLoginLog($login) !== null) {
                    $created++;
                }
            }
        });

        return $created;
    }

    public function syncLoginLog(UserLoginLog $login): ?UserActivityLog
    {
        if ($this->hasMatchingActivity($login)) {
            return null;
        }

        return UserActivityLog::create($this->mapLoginLogToActivity($login));
    }

    /**
     * @param  Collection<int, UserActivityLog>  $activities
     * @return Collection<int, UserActivityLog>
     */
    public function mergeMissingLoginLogs(
        Collection $activities,
        string $date,
        ?int $userId = null,
        ?string $email = null,
        ?string $role = null,
        ?string $activityType = null
    ): Collection {
        $loginQuery = UserLoginLog::query()->whereDate('logged_in_at', $date);

        if ($userId) {
            $loginQuery->where('user_id', $userId);
        }
        if ($email) {
            $loginQuery->where('email', 'like', '%'.$email.'%');
        }
        if ($role) {
            $loginQuery->where('user_role', $role);
        }

        $loginLogs = $loginQuery->get();
        $merged = $activities->values();

        foreach ($loginLogs as $login) {
            $mappedType = $login->success ? 'login' : 'login_failed';
            if ($activityType && $activityType !== $mappedType) {
                continue;
            }

            if ($this->hasMatchingActivity($login, $activities)) {
                continue;
            }

            $merged->push(new UserActivityLog($this->mapLoginLogToActivity($login)));
        }

        return $merged->sortByDesc(fn (UserActivityLog $row) => $row->occurred_at)->values();
    }

    /**
     * @param  Collection<int, UserActivityLog>|null  $existing
     */
    private function hasMatchingActivity(UserLoginLog $login, ?Collection $existing = null): bool
    {
        $from = Carbon::parse($login->logged_in_at)->subSeconds(3);
        $to = Carbon::parse($login->logged_in_at)->addSeconds(3);

        if ($existing) {
            $match = $existing->first(function (UserActivityLog $row) use ($login, $from, $to) {
                if (! in_array($row->activity_type, ['login', 'login_failed', 'login_blocked_ip'], true)) {
                    return false;
                }

                if ($login->email && strcasecmp((string) $row->email, (string) $login->email) !== 0) {
                    return false;
                }

                $at = Carbon::parse($row->occurred_at);

                return $at->betweenIncluded($from, $to);
            });

            if ($match) {
                return true;
            }
        }

        return UserActivityLog::query()
            ->whereIn('activity_type', ['login', 'login_failed', 'login_blocked_ip'])
            ->when($login->email, fn ($q) => $q->where('email', $login->email))
            ->whereBetween('occurred_at', [$from, $to])
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapLoginLogToActivity(UserLoginLog $login): array
    {
        $success = (bool) $login->success;

        return [
            'user_id' => $login->user_id,
            'email' => $login->email,
            'full_name' => $login->full_name,
            'user_role' => $login->user_role,
            'activity_type' => $success ? 'login' : 'login_failed',
            'module' => 'Authentication',
            'entity_label' => $success ? 'Sign in' : 'Failed sign-in',
            'description' => $success ? 'User signed in successfully' : 'Failed sign-in attempt',
            'success' => $success,
            'http_status' => $success ? 200 : 422,
            'ip_address' => $login->ip_address,
            'ip_country' => $login->ip_country,
            'ip_region' => $login->ip_region,
            'ip_city' => $login->ip_city,
            'ip_isp' => $login->ip_isp,
            'location_summary' => $login->location_summary,
            'user_agent' => $login->user_agent,
            'device_summary' => $login->device_summary,
            'browser' => $login->browser,
            'platform' => $login->platform,
            'route' => 'login',
            'http_method' => 'POST',
            'occurred_at' => $login->logged_in_at,
        ];
    }
}
