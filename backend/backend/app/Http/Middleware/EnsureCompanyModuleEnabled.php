<?php

namespace App\Http\Middleware;

use App\Support\CompanySetupSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyModuleEnabled
{
    /**
     * @param  string  $module  manufacturing|fixed_assets|dimensions
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $enabled = match ($module) {
            'manufacturing' => CompanySetupSettings::manufacturingEnabled(),
            'fixed_assets' => CompanySetupSettings::fixedAssetsEnabled(),
            'dimensions' => CompanySetupSettings::dimensionsEnabled(),
            default => true,
        };

        if (! $enabled) {
            $label = match ($module) {
                'dimensions' => 'Dimension',
                default => str_replace('_', ' ', ucfirst($module)),
            };

            return response()->json([
                'message' => "{$label} module is disabled in Company Setup.",
            ], 403);
        }

        return $next($request);
    }
}
