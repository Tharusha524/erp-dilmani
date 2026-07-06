<?php

namespace App\Repositories\All\BalanceSheet;

use App\Repositories\Base\EloquentRepositoryInterface;

interface BalanceSheetInterface extends EloquentRepositoryInterface
{
    public function search(array $filters);
}
