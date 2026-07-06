<?php

namespace App\Http\Controllers;

use App\Services\Auth\LoginIpRestrictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoginIpSettingsController extends Controller
{
    public function __construct(private LoginIpRestrictionService $ipRestriction)
    {
    }

    public function show(Request $request): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        return response()->json([
            ...$this->ipRestriction->getSettings(),
            'detectedIp' => $request->ip(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        if ($deny = $this->denyUnlessAdmin($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'loginIpRestrictionEnabled' => 'sometimes|boolean',
            'loginIpAllowLocalhost' => 'sometimes|boolean',
            'loginAllowedIps' => 'nullable|string|max:5000',
        ]);

        $settings = $this->ipRestriction->update($validated);

        return response()->json([
            'message' => 'Login IP settings saved.',
            'settings' => $settings,
            'detectedIp' => $request->ip(),
        ]);
    }

    private function denyUnlessAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if ($user && strcasecmp((string) $user->role, 'Admin') !== 0) {
            return response()->json(['message' => 'Only administrators can manage login IP settings.'], 403);
        }

        return null;
    }
}
