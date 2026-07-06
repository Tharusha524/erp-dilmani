<?php

namespace App\Repositories\All\TransTypes;

use App\Models\TransType;
use App\Repositories\Base\BaseRepository;

class TransTypesRepository extends BaseRepository implements TransTypesInterface
{
    public function __construct(TransType $model)
    {
        parent::__construct($model);
    }
}
