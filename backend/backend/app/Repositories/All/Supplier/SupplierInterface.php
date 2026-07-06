<?php

namespace App\Repositories\All\Supplier;

use App\Repositories\Base\EloquentRepositoryInterface;

interface SupplierInterface extends EloquentRepositoryInterface
{
    // Extra Supplier-specific methods (if needed) can go here.
    public function allWithRelations();
}
