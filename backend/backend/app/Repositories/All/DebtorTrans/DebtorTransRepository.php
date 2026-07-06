<?php

namespace App\Repositories\All\DebtorTrans;

use App\Models\DebtorTrans;
use App\Repositories\Base\BaseRepository;

class DebtorTransRepository extends BaseRepository implements DebtorTransInterface
{
    public function __construct(DebtorTrans $model)
    {
        parent::__construct($model);
    }
    
}
