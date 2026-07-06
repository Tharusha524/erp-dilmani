<?php

namespace App\Repositories\All\Currency;

use App\Models\Currency;
use App\Repositories\Base\BaseRepository;

class CurrencyRepository extends BaseRepository implements CurrencyInterface
{
    public function __construct(Currency $model)
    {
        parent::__construct($model);
    }
}
