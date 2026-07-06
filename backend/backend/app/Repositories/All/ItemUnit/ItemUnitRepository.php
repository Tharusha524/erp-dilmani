<?php

namespace App\Repositories\All\ItemUnit;

use App\Models\ItemUnit;
use App\Repositories\All\ItemUnit\ItemUnitInterface;
use App\Repositories\Base\BaseRepository;

class ItemUnitRepository extends BaseRepository implements ItemUnitInterface
{
    public function __construct(ItemUnit $model)
    {
        parent::__construct($model);
    }

}
