<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait PaginatesResourceIndex
{
    protected function jsonList(Request $request, Builder $query, ?int $defaultPerPage = null): JsonResponse
    {
        if ($this->shouldPaginateList($request)) {
            $perPage = $this->listPerPage($request, $defaultPerPage);

            return response()->json($query->paginate($perPage));
        }

        return response()->json($query->get());
    }

    protected function shouldPaginateList(Request $request): bool
    {
        return $request->boolean('paginate')
            || $request->filled('page')
            || $request->filled('per_page');
    }

    protected function listPerPage(Request $request, ?int $defaultPerPage = null): int
    {
        $default = $defaultPerPage ?? (int) config('performance.default_list_per_page', 50);
        $max = (int) config('performance.max_list_per_page', 200);

        return min(max((int) $request->input('per_page', $default), 1), $max);
    }
}
