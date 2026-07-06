<?php

namespace App\Repositories\All\SalesArea;

use App\Models\SalesArea;
use App\Repositories\Base\BaseRepository;

class SalesAreaRepository extends BaseRepository implements SalesAreaInterface
{
    public function __construct(SalesArea $model)
    {
        parent::__construct($model);
    }

}
