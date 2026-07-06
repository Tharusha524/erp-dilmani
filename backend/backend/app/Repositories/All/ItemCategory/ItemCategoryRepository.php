<?php

namespace App\Repositories\All\ItemCategory;

use App\Models\ItemCategory;
use App\Repositories\Base\BaseRepository;

class ItemCategoryRepository extends BaseRepository implements ItemCategoryInterface
{
    public function __construct(ItemCategory $model)
    {
        parent::__construct($model);
    }

}
