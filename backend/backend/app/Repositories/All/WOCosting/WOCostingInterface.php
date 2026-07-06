<?php

namespace App\Repositories\All\WOCosting;

use App\Repositories\Base\EloquentRepositoryInterface;

interface WOCostingInterface extends EloquentRepositoryInterface
{
    public function getByWorkorder(int $workorderId);
}
