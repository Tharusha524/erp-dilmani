<?php

namespace App\Repositories\All\CostCenter;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Support\Collection;

interface CostCenterInterface extends EloquentRepositoryInterface
{
    public function search(array $filters): Collection;

    public function glBalance(int $costCenterId, ?string $fromDate = null, ?string $toDate = null): array;

    public function hasGlTransactions(int $costCenterId): bool;
}
