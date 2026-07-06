<?php

namespace App\Repositories\All\GlType;

use App\Models\GlType;
use App\Repositories\Base\BaseRepository;

class GlTypeRepository extends BaseRepository implements GlTypeInterface
{
    public function __construct(GlType $model)
    {
        parent::__construct($model);
    }
}
