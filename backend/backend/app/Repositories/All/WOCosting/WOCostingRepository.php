<?php

namespace App\Repositories\All\WOCosting;

use App\Models\WOCosting;
use App\Repositories\Base\BaseRepository;

class WOCostingRepository extends BaseRepository implements WOCostingInterface
{
    public function __construct(WOCosting $model)
    {
        parent::__construct($model);
    }

    public function getByWorkorder(int $workorderId)
    {
        return $this->model
            ->where('workorder_id', $workorderId)
            ->with(['transType'])
            ->get();
    }
}
