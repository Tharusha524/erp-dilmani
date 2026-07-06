<?php

namespace App\Repositories\All\ClassType;

use App\Models\ClassType;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class ClassTypeRepository extends BaseRepository implements ClassTypeInterface
{
    public function __construct(ClassType $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        // If you want to load related chart classes, you can include ->with('chartClasses')
        return $this->model->with('chartClasses')->get();
    }
}
