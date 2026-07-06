<?php

namespace App\Repositories\All\CrmCategory;

use App\Models\CrmCategory;
use App\Repositories\Base\BaseRepository;

class CrmCategoryRepository extends BaseRepository implements CrmCategoryInterface
{
    public function __construct(CrmCategory $model)
    {
        parent::__construct($model);
    }
}
