<?php

namespace App\Repositories\All\Department;

use App\Models\Department;
use App\Repositories\Base\BaseRepository;

class DepartmentRepository extends BaseRepository implements DepartmentInterface
{
    public function __construct(Department $model)
    {
        parent::__construct($model);
    }
}
