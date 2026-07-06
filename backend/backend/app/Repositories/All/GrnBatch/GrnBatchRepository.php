<?php

namespace App\Repositories\All\GrnBatch;

use App\Models\GrnBatch;
use App\Repositories\Base\BaseRepository;

class GrnBatchRepository extends BaseRepository implements GrnBatchInterface
{
    public function __construct(GrnBatch $model)
    {
        parent::__construct($model);
    }
}
