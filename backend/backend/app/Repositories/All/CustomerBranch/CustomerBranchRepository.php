<?php

namespace App\Repositories\All\CustomerBranch;

use App\Models\CustomerBranch;
use App\Repositories\Base\BaseRepository;

class CustomerBranchRepository extends BaseRepository implements CustomerBranchInterface
{
    public function __construct(CustomerBranch $model)
    {
        parent::__construct($model);
    }

    public function allWithRelations()
    {
        return $this->model->with(['debtor', 'salesArea', 'salesPerson', 'inventoryLocation', 'taxGroup', 'shippingCompany', 'salesGroup', 'salesAccount', 'salesDiscountAccount', 'receivablesAccount', 'paymentDiscountAccount'])->get();
    }
}
