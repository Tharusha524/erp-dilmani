<?php

namespace App\Repositories\All\Bom;

use App\Repositories\Base\EloquentRepositoryInterface;

interface BomInterface extends EloquentRepositoryInterface
{
    public function findByParent(string $parent);
}
