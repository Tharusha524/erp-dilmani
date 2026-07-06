<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
  public function __construct(private DashboardService $service)
  {
  }

  public function index(): JsonResponse
  {
    return response()->json($this->service->getSummary());
  }

  public function alerts(): JsonResponse
  {
    return response()->json([
      'alerts' => $this->service->getAlerts(),
    ]);
  }
}
