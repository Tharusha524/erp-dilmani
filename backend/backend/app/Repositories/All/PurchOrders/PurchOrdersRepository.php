<?php

namespace App\Repositories\All\PurchOrders;

use App\Models\PurchOrder;
use App\Repositories\Base\BaseRepository;

class PurchOrdersRepository extends BaseRepository implements PurchOrdersInterface
{
    public function __construct(PurchOrder $model)
    {
        parent::__construct($model);
    }
}
