<?php

namespace App\Repositories\All\SalesOrderDetails;

use App\Models\SalesOrderDetail;
use App\Repositories\Base\BaseRepository;

class SalesOrderDetailsRepository extends BaseRepository implements SalesOrderDetailsInterface
{
    public function __construct(SalesOrderDetail $model)
    {
        parent::__construct($model);
    }
}
