<?php

namespace App\Repositories\All\ChartMaster;

use App\Models\ChartMaster;
use App\Repositories\Base\BaseRepository;

class ChartMasterRepository extends BaseRepository implements ChartMasterInterface
{
    public function __construct(ChartMaster $model)
    {
        parent::__construct($model);
    }

    // Example: load relations
    public function allWithRelations()
    {
        return $this->model->with('chartType')->get();
    }

}
