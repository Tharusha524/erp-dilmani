<?php

namespace App\Repositories\All\GrnItems;

use App\Models\GrnItem;
use App\Repositories\Base\BaseRepository;

class GrnItemsRepository extends BaseRepository implements GrnItemsInterface
{
    public function __construct(GrnItem $model)
    {
        parent::__construct($model);
    }
}
