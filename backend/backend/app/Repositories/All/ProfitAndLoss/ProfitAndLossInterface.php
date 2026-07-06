<?php

namespace App\Repositories\All\ProfitAndLoss;

use App\Repositories\Base\EloquentRepositoryInterface;

interface ProfitAndLossInterface extends EloquentRepositoryInterface
{
    public function search(array $filters);
}
