<?php

namespace App\Repositories\All\DepreciationPeriod;

use App\Models\DepreciationPeriod;
use App\Repositories\Base\BaseRepository;

class DepreciationPeriodRepository extends BaseRepository implements DepreciationPeriodInterface
{
    public function __construct(DepreciationPeriod $model)
    {
        parent::__construct($model);
    }
}
