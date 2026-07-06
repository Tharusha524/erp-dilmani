<?php

namespace App\Repositories\All\PurchData;

use App\Models\PurchData;
use App\Repositories\Base\BaseRepository;

class PurchDataRepository extends BaseRepository implements PurchDataInterface
{
    public function __construct(PurchData $model)
    {
        parent::__construct($model);
    }
}
