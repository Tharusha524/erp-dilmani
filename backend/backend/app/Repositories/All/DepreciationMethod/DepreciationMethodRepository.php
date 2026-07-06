<?php

namespace App\Repositories\All\DepreciationMethod;

use App\Models\DepreciationMethod;
use App\Repositories\Base\BaseRepository;

class DepreciationMethodRepository extends BaseRepository implements DepreciationMethodInterface
{
    public function __construct(DepreciationMethod $model)
    {
        parent::__construct($model);
    }
}
