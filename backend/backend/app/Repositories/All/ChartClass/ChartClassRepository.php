<?php

namespace App\Repositories\All\ChartClass;

use App\Models\ChartClass;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class ChartClassRepository extends BaseRepository implements ChartClassInterface
{
    public function __construct(ChartClass $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with('chartTypes')->get();
    }
}
