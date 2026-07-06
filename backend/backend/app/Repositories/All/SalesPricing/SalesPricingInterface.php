<?php

namespace App\Repositories\All\SalesPricing;

use App\Repositories\Base\EloquentRepositoryInterface;

interface SalesPricingInterface extends EloquentRepositoryInterface
{
    // Add custom methods if needed later
    public function allWithRelations();
    public function allWithRelationsByStockId(string $stockId);
    public function findWithRelations(string $id);
}
