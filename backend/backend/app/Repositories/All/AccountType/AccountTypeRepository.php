<?php

namespace App\Repositories\All\AccountType;

use App\Models\AccountType;
use App\Repositories\Base\BaseRepository;

class AccountTypeRepository extends BaseRepository implements AccountTypeInterface
{
    public function __construct(AccountType $model)
    {
        parent::__construct($model);
    }
}
