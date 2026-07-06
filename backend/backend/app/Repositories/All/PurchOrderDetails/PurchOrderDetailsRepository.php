<?php

namespace App\Repositories\All\PurchOrderDetails;

use App\Models\PurchOrderDetail;
use App\Repositories\Base\BaseRepository;

class PurchOrderDetailsRepository extends BaseRepository implements PurchOrderDetailsInterface
{
    public function __construct(PurchOrderDetail $model)
    {
        parent::__construct($model);
    }
}
