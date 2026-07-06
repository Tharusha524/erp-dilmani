<?php

namespace App\Repositories\All\CrmPersons;

use App\Models\CrmPersons;
use App\Repositories\Base\BaseRepository;

class CrmPersonsRepository extends BaseRepository implements CrmPersonsInterface
{
    public function __construct(CrmPersons $model)
    {
        parent::__construct($model);
    }
}
