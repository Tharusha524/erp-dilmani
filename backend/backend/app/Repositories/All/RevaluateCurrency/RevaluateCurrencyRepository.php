<?php

namespace App\Repositories\All\RevaluateCurrency;

use App\Models\RevaluateCurrency;
use App\Repositories\Base\BaseRepository;

class RevaluateCurrencyRepository extends BaseRepository implements RevaluateCurrencyInterface
{
    public function __construct(RevaluateCurrency $model)
    {
        parent::__construct($model);
    }
}
