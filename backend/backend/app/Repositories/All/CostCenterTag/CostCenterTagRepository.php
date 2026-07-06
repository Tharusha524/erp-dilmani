<?php

namespace App\Repositories\All\CostCenterTag;

use App\Models\CostCenterTag;
use App\Repositories\Base\BaseRepository;

class CostCenterTagRepository extends BaseRepository implements CostCenterTagInterface
{
    public function __construct(CostCenterTag $model)
    {
        parent::__construct($model);
    }
}
