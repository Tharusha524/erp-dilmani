<?php

namespace App\Repositories\All\SuppTrans;

use App\Models\SuppTrans;
use App\Repositories\Base\BaseRepository;

class SuppTransRepository extends BaseRepository implements SuppTransInterface
{
    public function __construct(SuppTrans $model)
    {
        parent::__construct($model);
    }
}