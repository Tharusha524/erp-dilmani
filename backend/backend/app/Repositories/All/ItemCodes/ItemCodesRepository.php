<?php

namespace App\Repositories\All\ItemCodes;

use App\Models\ItemCode;
use App\Repositories\Base\BaseRepository;

class ItemCodesRepository extends BaseRepository implements ItemCodesInterface
{
    public function __construct(ItemCode $model)
    {
        parent::__construct($model);
    }
}
