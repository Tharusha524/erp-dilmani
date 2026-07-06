<?php

namespace App\Repositories\All\SuppAllocations;

use App\Models\SuppAllocation;
use App\Repositories\Base\BaseRepository;

class SuppAllocationsRepository extends BaseRepository implements SuppAllocationsInterface
{
    public function __construct(SuppAllocation $model)
    {
        parent::__construct($model);
    }
}
