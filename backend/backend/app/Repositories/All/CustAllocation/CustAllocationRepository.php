<?php

namespace App\Repositories\All\CustAllocation;

use App\Models\CustAllocation;
use App\Repositories\Base\BaseRepository;

class CustAllocationRepository extends BaseRepository implements CustAllocationInterface
{
    public function __construct(CustAllocation $model)
    {
        parent::__construct($model);
    }
}
