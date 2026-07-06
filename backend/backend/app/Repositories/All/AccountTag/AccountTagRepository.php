<?php

namespace App\Repositories\All\AccountTag;

use App\Models\AccountTag;
use App\Repositories\Base\BaseRepository;

class AccountTagRepository extends BaseRepository implements AccountTagInterface
{
    public function __construct(AccountTag $model)
    {
        parent::__construct($model);
    }
}
