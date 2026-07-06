<?php

namespace App\Repositories\All\StockFaClass;

use App\Models\StockFaClass;
use App\Repositories\Base\BaseRepository;

class StockFaClassRepository extends BaseRepository implements StockFaClassInterface
{
    public function __construct(StockFaClass $model)
    {
        parent::__construct($model);
    }
}
