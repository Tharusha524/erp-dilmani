<?php

namespace App\Repositories\All\SalesType;

use App\Models\SalesType;
use App\Repositories\Base\BaseRepository;

class SalesTypeRepository extends BaseRepository implements SalesTypeInterface
{
    public function __construct(SalesType $model)
    {
        parent::__construct($model);
    }

    // Add SalesType specific queries here if needed
}
