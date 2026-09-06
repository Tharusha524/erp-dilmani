<?php

namespace App\Http\Middleware;

use App\Models\DebtorsMaster;
use Closure;
use Illuminate\Http\Request;

class EnsureCustomerToken
{
    /**
     * Restrict a route to requests authenticated as a customer (DebtorsMaster)
     * whose Sanctum token carries the "customer" ability. Keeps customer
     * tokens from ever resolving staff/admin routes, and vice versa.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user instanceof DebtorsMaster) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token = $user->currentAccessToken();
        if (! $token || (method_exists($token, 'can') && ! $token->can('customer'))) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
