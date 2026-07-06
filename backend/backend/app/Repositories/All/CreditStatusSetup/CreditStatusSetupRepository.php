<?php

namespace App\Repositories\All\CreditStatusSetup;

use App\Models\CreditStatusSetup;
use App\Repositories\Base\BaseRepository;

class CreditStatusSetupRepository extends BaseRepository implements CreditStatusSetupInterface
{
    public function __construct(CreditStatusSetup $model)
    {
        parent::__construct($model);
    }

}
