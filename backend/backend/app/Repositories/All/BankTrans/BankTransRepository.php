<?php

namespace App\Repositories\All\BankTrans;

use App\Models\BankTrans;
use App\Repositories\Base\BaseRepository;

class BankTransRepository extends BaseRepository implements BankTransInterface
{
    public function __construct(BankTrans $model)
    {
        parent::__construct($model);
    }
}
