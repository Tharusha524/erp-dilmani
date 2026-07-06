<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * Usage in routes: ->middleware(['auth:sanctum','permission:1100'])
     * or for multiple: ->middleware(['auth:sanctum','permission:1100,1401'])
     */
    public function handle(Request $request, Closure $next, $requiredPermissions = null)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Fetch role row
        $roleRow = DB::table('security_roles')->where('role', $user->role)->first();

        if (!$roleRow) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Build a set of numeric permission ids from sections and areas
        $collect = function ($str) {
            if (!$str) return [];
            return array_map('intval', array_filter(explode(';', $str)));
        };

        $perms = array_unique(array_merge($collect($roleRow->sections), $collect($roleRow->areas)));

        // If no required permission specified, deny
        if (empty($requiredPermissions)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // requiredPermissions may be comma-separated (e.g., "1100,1401")
        $required = array_map('intval', array_filter(explode(',', $requiredPermissions)));

        // If any required exists in role perms → allow
        $intersect = array_intersect($required, $perms);
        if (count($intersect) === 0) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}