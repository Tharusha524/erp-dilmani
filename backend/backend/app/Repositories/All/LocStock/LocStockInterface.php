<?php

namespace App\Repositories\All\LocStock;

use App\Repositories\Base\EloquentRepositoryInterface;

interface LocStockInterface extends EloquentRepositoryInterface
{
    public function deleteByCompositeKey(string $locCode, string $stockId): bool;
    public function findByCompositeKey(string $locCode, string $stockId);
    public function updateByCompositeKey(string $locCode, string $stockId, array $data): bool;
}