<?php

namespace App\Repositories\All\ItemTaxType;

use App\Models\ItemTaxTypes;
use App\Repositories\Base\BaseRepository;

class ItemTaxTypeRepository extends BaseRepository implements ItemTaxTypeInterface
{
    public function __construct(ItemTaxTypes $model)
    {
        parent::__construct($model);
    }

}
