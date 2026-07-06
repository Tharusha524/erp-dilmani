<?php

namespace App\Repositories\All\ExchangeRate;

use App\Models\ExchangeRate;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class ExchangeRateRepository extends BaseRepository implements ExchangeRateInterface
{
    public function __construct(ExchangeRate $model)
    {
        parent::__construct($model);
    }
    
    public function all(): Collection
    {
        return $this->model->with([
            'currency'
        ])->get();
    }
}
