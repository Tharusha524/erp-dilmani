<?php

namespace App\Repositories\All\PurchasingPricing;

use App\Repositories\Base\EloquentRepositoryInterface;

interface PurchasingPricingInterface extends EloquentRepositoryInterface
{
     public function deleteByCompositeKey(int $supplierId, string $stockId): bool;
     public function findByCompositeKey(int $supplier_id, string $stock_id);
     public function updateByCompositeKey($supplier_id, $stock_id, array $data): bool;
     public function allByStockId(string $stockId);
}