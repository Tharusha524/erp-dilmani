<?php

namespace App\Repositories\All\FixedAssetsLocation;

use App\Models\FixedAssetsLocation;
use App\Repositories\Base\BaseRepository;

class FixedAssetsLocationRepository extends BaseRepository implements FixedAssetsLocationInterface
{
    public function __construct(FixedAssetsLocation $model)
    {
        parent::__construct($model);
    }
}
