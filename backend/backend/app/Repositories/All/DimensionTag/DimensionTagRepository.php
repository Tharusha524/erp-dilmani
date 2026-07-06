<?php

namespace App\Repositories\All\DimensionTag;

use App\Models\DimensionTag;
use App\Repositories\Base\BaseRepository;

class DimensionTagRepository extends BaseRepository implements DimensionTagInterface
{
    public function __construct(DimensionTag $model)
    {
        parent::__construct($model);
    }
}
