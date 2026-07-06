<?php

namespace App\Repositories\All\Reflines;

use App\Models\RefLine;
use App\Repositories\Base\BaseRepository;

class ReflinesRepository extends BaseRepository implements ReflinesInterface
{
    public function __construct(RefLine $model)
    {
        parent::__construct($model);
    }
}
