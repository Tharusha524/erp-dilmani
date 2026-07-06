<?php

namespace App\Repositories\All\Dimension;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Support\Collection;

interface DimensionInterface extends EloquentRepositoryInterface
{
    public function search(array $filters): Collection;

    public function glBalance(int $dimensionId, ?string $fromDate = null, ?string $toDate = null): array;

    public function hasGlTransactions(int $dimensionId): bool;
}
