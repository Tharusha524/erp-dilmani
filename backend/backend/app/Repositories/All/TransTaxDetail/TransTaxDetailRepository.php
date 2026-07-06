<?php

namespace App\Repositories\All\TransTaxDetail;

use App\Models\TransTaxDetail;
use App\Repositories\Base\BaseRepository;

class TransTaxDetailRepository extends BaseRepository implements TransTaxDetailInterface
{
    public function __construct(TransTaxDetail $model)
    {
        parent::__construct($model);
    }
}
