<?php

namespace App\Repositories\All\ItemTaxTypeException;

use App\Repositories\Base\EloquentRepositoryInterface;

interface ItemTaxTypeExceptionInterface extends EloquentRepositoryInterface
{
     public function deleteByCompositeKey(int $itemId, int $taxTypeId): bool;
}