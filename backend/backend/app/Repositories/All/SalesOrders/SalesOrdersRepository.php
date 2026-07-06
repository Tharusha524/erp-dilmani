<?php

namespace App\Repositories\All\SalesOrders;

use App\Repositories\Base\BaseRepository;
use App\Models\SalesOrder;

class SalesOrdersRepository extends BaseRepository implements SalesOrdersInterface
{
    public function __construct(SalesOrder $model)
    {
        parent::__construct($model);
    }
}
