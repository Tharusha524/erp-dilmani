<?php

namespace App\Repositories\All\ShippingCompany;

use App\Models\ShippingCompany;
use App\Repositories\Base\BaseRepository;

class ShippingCompanyRepository extends BaseRepository implements ShippingCompanyInterface
{
    public function __construct(ShippingCompany $model)
    {
        parent::__construct($model);
    }
}
