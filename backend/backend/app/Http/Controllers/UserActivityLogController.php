<?php

namespace App\Http\Controllers;

use App\Models\UserActivityLog;
use App\Models\UserLoginLog;
use App\Services\Auth\LoginActivitySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class UserActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        $query = UserActivityLog::query()->orderByDesc('occurred_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->input('user_id'));
        }
        if ($request->filled('email')) {
            $query->where('email', 'like', '%'.$request->input('email').'%');
        }
        if ($request->filled('role')) {
            $query->where('user_role', $request->input('role'));
        }
        if ($request->filled('activity_type')) {
            $query->where('activity_type', $request->input('activity_type'));
        }
        if ($request->filled('module')) {
            $query->where('module', 'like', '%'.$request->input('module').'%');
        }
        if ($request->filled('fromDate')) {
            $query->whereDate('occurred_at', '>=', $request->input('fromDate'));
        }
        if ($request->filled('toDate')) {
            $query->whereDate('occurred_at', '<=', $request->input('toDate'));
        }
        if ($request->has('success') && $request->input('success') !== '') {
            $query->where('success', filter_var($request->input('success'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) $request->input('per_page', 50), 200);

        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        $log = UserActivityLog::find($id);
        if (! $log) {
            return response()->json(['message' => 'Activity not found'], 404);
        }

        $day = Carbon::parse($log->occurred_at)->toDateString();

        return response()->json([
            'activity' => $log,
            'daily' => $this->dailyPayload($log->user_id, $log->email, $day),
        ]);
    }

    public function daily(Request $request): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        $date = $request->input('date', now()->toDateString());
        $userId = $request->input('user_id');
        $email = $request->input('email');

        if (! $userId && ! $email) {
            return response()->json(['message' => 'user_id or email is required'], 422);
        }

        return response()->json($this->dailyPayload(
            $userId ? (int) $userId : null,
            $email ? (string) $email : null,
            (string) $date
        ));
    }

    public function dailyOverview(Request $request): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        $date = (string) $request->input('date', now()->toDateString());

        $activitiesQuery = UserActivityLog::query()->whereDate('occurred_at', $date);

        if ($request->filled('user_id')) {
            $activitiesQuery->where('user_id', (int) $request->input('user_id'));
        }
        if ($request->filled('email')) {
            $activitiesQuery->where('email', 'like', '%'.$request->input('email').'%');
        }
        if ($request->filled('role')) {
            $activitiesQuery->where('user_role', $request->input('role'));
        }
        if ($request->filled('activity_type')) {
            $activitiesQuery->where('activity_type', $request->input('activity_type'));
        }

        $activities = $activitiesQuery->orderByDesc('occurred_at')->get();

        $activities = app(LoginActivitySyncService::class)->mergeMissingLoginLogs(
            $activities,
            $date,
            $request->filled('user_id') ? (int) $request->input('user_id') : null,
            $request->filled('email') ? (string) $request->input('email') : null,
            $request->filled('role') ? (string) $request->input('role') : null,
            $request->filled('activity_type') ? (string) $request->input('activity_type') : null,
        );

        $overall = $this->buildSummary($activities);

        $users = $activities
            ->groupBy(fn (UserActivityLog $row) => ($row->user_id ?? '0').'|'.($row->email ?? ''))
            ->map(function ($rows) {
                /** @var \Illuminate\Support\Collection<int, UserActivityLog> $rows */
                $first = $rows->first();
                $latest = $rows->sortByDesc('occurred_at')->first();

                return [
                    'user_id' => $first?->user_id,
                    'email' => $first?->email,
                    'full_name' => $first?->full_name,
                    'user_role' => $first?->user_role,
                    'last_activity_at' => $latest?->occurred_at,
                    'last_ip' => $latest?->ip_address,
                    'last_location' => $latest?->location_summary,
                    'last_device' => $latest?->device_summary,
                    'summary' => $this->buildSummary($rows),
                    'activities' => $rows->sortBy('occurred_at')->values(),
                ];
            })
            ->values();

        return response()->json([
            'date' => $date,
            'total' => $activities->count(),
            'summary' => $overall,
            'users' => $users,
            'activities' => $activities,
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, UserActivityLog>  $activities
     * @return array<string, int>
     */
    private function buildSummary($activities): array
    {
        return [
            'logins' => $activities->whereIn('activity_type', ['login', 'login_failed', 'login_blocked_ip'])->count(),
            'creates' => $activities->where('activity_type', 'create')->count(),
            'updates' => $activities->where('activity_type', 'update')->count(),
            'deletes' => $activities->where('activity_type', 'delete')->count(),
            'posts' => $activities->where('activity_type', 'post')->count(),
            'voids' => $activities->where('activity_type', 'void')->count(),
            'other' => $activities->whereNotIn('activity_type', [
                'login', 'login_failed', 'login_blocked_ip', 'create', 'update', 'delete', 'post', 'void',
            ])->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dailyPayload(?int $userId, ?string $email, string $date): array
    {
        $activityQuery = UserActivityLog::query()->whereDate('occurred_at', $date);
        $loginQuery = UserLoginLog::query()->whereDate('logged_in_at', $date);

        if ($userId) {
            $activityQuery->where('user_id', $userId);
            $loginQuery->where('user_id', $userId);
        } elseif ($email) {
            $activityQuery->where('email', $email);
            $loginQuery->where('email', $email);
        }

        $activities = $activityQuery->orderBy('occurred_at')->get();
        $logins = $loginQuery->orderBy('logged_in_at')->get();

        $summary = $this->buildSummary($activities);

        return [
            'date' => $date,
            'user_id' => $userId,
            'email' => $email,
            'summary' => $summary,
            'logins' => $logins,
            'activities' => $activities,
        ];
    }

    private function denyUnlessAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if ($user && strcasecmp((string) $user->role, 'Admin') !== 0) {
            return response()->json(['message' => 'Only administrators can view user activity.'], 403);
        }

        return null;
    }
}
