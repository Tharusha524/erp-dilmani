<?php

namespace App\Repositories\All\SalesGroup;

use App\Models\SalesGroup;
use App\Repositories\Base\BaseRepository;

class SalesGroupRepository extends BaseRepository implements SalesGroupInterface
{
    public function __construct(SalesGroup $model)
    {
        parent::__construct($model);
    }

    // Additional custom methods for SalesGroup can be added here
}
