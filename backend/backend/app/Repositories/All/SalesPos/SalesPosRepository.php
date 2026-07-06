<?php

namespace App\Repositories\All\SalesPos;

use App\Models\SalesPos;
use App\Repositories\Base\BaseRepository;

class SalesPosRepository extends BaseRepository implements SalesPosInterface
{
    public function __construct(SalesPos $model)
    {
        parent::__construct($model);
    }

}
