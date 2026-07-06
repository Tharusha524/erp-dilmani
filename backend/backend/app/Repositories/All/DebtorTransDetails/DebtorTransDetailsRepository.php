<?php

namespace App\Repositories\All\DebtorTransDetails;

use App\Models\DebtorTransDetail;
use App\Repositories\Base\BaseRepository;

class DebtorTransDetailsRepository extends BaseRepository implements DebtorTransDetailsInterface
{
    public function __construct(DebtorTransDetail $model)
    {
        parent::__construct($model);
    }
}
