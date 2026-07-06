<?php

namespace App\Repositories\All\TaxType;

use App\Repositories\Base\EloquentRepositoryInterface;

interface TaxTypeInterface extends EloquentRepositoryInterface
{
    // Add tax type specific methods here if needed
    public function allWithRelations();
}
