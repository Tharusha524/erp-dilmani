<?php

namespace App\Repositories\All\ChartType;

use App\Models\ChartType;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class ChartTypeRepository extends BaseRepository implements ChartTypeInterface
{
    public function __construct(ChartType $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with('chartClass')->get();
    }
}
