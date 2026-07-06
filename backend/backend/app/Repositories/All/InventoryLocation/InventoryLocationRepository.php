<?php

namespace App\Repositories\All\InventoryLocation;

use App\Models\InventoryLocation;
use App\Repositories\Base\BaseRepository;

class InventoryLocationRepository extends BaseRepository implements InventoryLocationInterface
{
    public function __construct(InventoryLocation $model)
    {
        parent::__construct($model);
    }

}
