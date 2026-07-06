<?php

namespace App\Repositories\All\ItemType;

use App\Models\ItemType;
use App\Repositories\Base\BaseRepository;

class ItemTypeRepository extends BaseRepository implements ItemTypeInterface
{
    public function __construct(ItemType $model)
    {
        parent::__construct($model);
    }

}
