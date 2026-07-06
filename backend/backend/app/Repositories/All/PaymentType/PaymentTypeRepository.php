<?php

namespace App\Repositories\All\PaymentType;

use App\Models\PaymentType;
use App\Repositories\Base\BaseRepository;

class PaymentTypeRepository extends BaseRepository implements PaymentTypeInterface
{
    public function __construct(PaymentType $model)
    {
        parent::__construct($model);
    }
}
