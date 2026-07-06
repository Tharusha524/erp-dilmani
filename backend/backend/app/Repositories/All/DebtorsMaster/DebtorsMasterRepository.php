<?php

namespace App\Repositories\All\DebtorsMaster;

use App\Models\DebtorsMaster;
use App\Repositories\Base\BaseRepository;

class DebtorsMasterRepository extends BaseRepository implements DebtorsMasterInterface
{
    public function __construct(DebtorsMaster $model)
    {
        parent::__construct($model);
    }

    public function allWithRelations()
    {
        return $this->model->with(['currency', 'salesType', 'creditStatus', 'paymentTerm'])->get();
    }

    public function findWithRelations($id)
    {
        return $this->model->with(['currency', 'salesType', 'creditStatus', 'paymentTerm'])->findOrFail($id);
    }
}
