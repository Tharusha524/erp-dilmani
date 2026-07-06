<?php

namespace App\Repositories\All\Refs;

use App\Models\Ref;
use App\Repositories\Base\BaseRepository;

class RefsRepository extends BaseRepository implements RefsInterface
{
    public function __construct(Ref $model)
    {
        parent::__construct($model);
    }
}
