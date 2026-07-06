<?php

namespace App\Repositories\All\TaxGroupItem;

use App\Repositories\Base\EloquentRepositoryInterface;

interface TaxGroupItemInterface extends EloquentRepositoryInterface
{
    public function deleteByCompositeKey(int $tax_group_id, int $tax_type_id): bool;
}
