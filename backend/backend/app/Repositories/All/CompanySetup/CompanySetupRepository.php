<?php

namespace App\Repositories\All\CompanySetup;

use App\Models\CompanySetup;
use App\Repositories\Base\BaseRepository;
use illuminate\Database\Eloquent\Collection;

class CompanySetupRepository extends BaseRepository implements CompanySetupInterface
{
    public function __construct(CompanySetup $model)
    {
        parent::__construct($model);
    }

    public function allWithRelations()
    {
        return $this->model->with(['homeCurrency', 'fiscalYear', 'basePriceCalculation'])->get();
    }
}