<?php

namespace App\Http\Controllers;

use App\Services\System\SystemDiagnosticsService;
use Illuminate\Http\JsonResponse;

class SystemDiagnosticsController extends Controller
{
    public function __construct(private SystemDiagnosticsService $service)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->service->run());
    }
}
