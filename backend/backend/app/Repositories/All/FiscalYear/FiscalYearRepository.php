<?php

namespace App\Repositories\All\FiscalYear;

use App\Models\FiscalYear;
use App\Repositories\Base\BaseRepository;

class FiscalYearRepository extends BaseRepository implements FiscalYearInterface
{
    public function __construct(FiscalYear $model)
    {
        parent::__construct($model);
    }

    // Add fiscal year specific methods if required
}
