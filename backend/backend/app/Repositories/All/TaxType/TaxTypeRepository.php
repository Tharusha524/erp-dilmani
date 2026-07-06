<?php

namespace App\Repositories\All\TaxType;

use App\Models\TaxType;
use App\Repositories\Base\BaseRepository;

class TaxTypeRepository extends BaseRepository implements TaxTypeInterface
{
    public function __construct(TaxType $model)
    {
        parent::__construct($model);
    }

    public function allWithRelations()
    {
        return $this->model->with(['salesGlAccount', 'purchasingGlAccount'])->get();
    }
}
