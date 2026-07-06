<?php

namespace App\Repositories\All\SalesPerson;

use App\Models\SalesPerson;
use App\Repositories\Base\BaseRepository;

class SalesPersonRepository extends BaseRepository implements SalesPersonInterface
{
    public function __construct(SalesPerson $model)
    {
        parent::__construct($model);
    }

    // Add custom query methods if required
}
