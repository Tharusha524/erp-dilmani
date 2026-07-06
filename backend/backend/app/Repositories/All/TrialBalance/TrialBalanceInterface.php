<?php

namespace App\Repositories\All\TrialBalance;

use App\Repositories\Base\EloquentRepositoryInterface;

interface TrialBalanceInterface extends EloquentRepositoryInterface
{
    public function search(array $filters);
}
