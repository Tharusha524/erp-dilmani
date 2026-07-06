<?php

namespace App\Http\Controllers;

use App\Models\UserLoginLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserLoginLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && strcasecmp((string) $user->role, 'Admin') !== 0) {
            return response()->json(['message' => 'Only administrators can view login activity.'], 403);
        }

        $query = UserLoginLog::query()->orderByDesc('logged_in_at');

        if ($request->filled('email')) {
            $query->where('email', 'like', '%'.$request->input('email').'%');
        }
        if ($request->filled('role')) {
            $query->where('user_role', $request->input('role'));
        }
        if ($request->filled('fromDate')) {
            $query->whereDate('logged_in_at', '>=', $request->input('fromDate'));
        }
        if ($request->filled('toDate')) {
            $query->whereDate('logged_in_at', '<=', $request->input('toDate'));
        }
        if ($request->has('success') && $request->input('success') !== '') {
            $query->where('success', filter_var($request->input('success'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) $request->input('per_page', 50), 200);

        return response()->json($query->paginate($perPage));
    }
}
