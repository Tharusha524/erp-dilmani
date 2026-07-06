<?php

namespace App\Repositories\All\TaxGroup;

use App\Models\TaxGroup;
use App\Repositories\Base\BaseRepository;

class TaxGroupRepository extends BaseRepository implements TaxGroupInterface
{
    public function __construct(TaxGroup $model)
    {
        parent::__construct($model);
    }
}
