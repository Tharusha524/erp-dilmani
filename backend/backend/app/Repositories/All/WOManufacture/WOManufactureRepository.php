<?php

namespace App\Repositories\All\WOManufacture;

use App\Models\WOManufacture;
use App\Repositories\Base\BaseRepository;

class WOManufactureRepository extends BaseRepository implements WOManufactureInterface
{
    public function __construct(WOManufacture $model)
    {
        parent::__construct($model);
    }
}
