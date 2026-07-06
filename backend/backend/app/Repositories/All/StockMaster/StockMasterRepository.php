<?php

namespace App\Repositories\All\StockMaster;

use App\Models\StockMaster;
use App\Repositories\Base\BaseRepository;

class StockMasterRepository extends BaseRepository implements StockMasterInterface
{
    public function __construct(StockMaster $model)
    {
        parent::__construct($model);
    }
}
