<?php

namespace App\Repositories\All\WorkCentre;

use App\Models\WorkCentre;
use App\Repositories\Base\BaseRepository;

class WorkCentreRepository extends BaseRepository implements WorkCentreInterface
{
    public function __construct(WorkCentre $model)
    {
        parent::__construct($model);
    }

}
