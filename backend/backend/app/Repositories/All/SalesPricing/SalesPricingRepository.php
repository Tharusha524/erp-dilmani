<?php

namespace App\Repositories\All\SalesPricing;

use App\Models\SalesPricing;
use App\Repositories\Base\BaseRepository;

class SalesPricingRepository extends BaseRepository implements SalesPricingInterface
{
    public function __construct(SalesPricing $model)
    {
        parent::__construct($model);
    }

    // Example: custom query with relations
    public function allWithRelations()
    {
        return $this->model->with(['currency', 'salesType'])->get();
    }

    public function allWithRelationsByStockId(string $stockId)
    {
        return $this->model
            ->with(['currency', 'salesType'])
            ->where('stock_id', $stockId)
            ->get();
    }

    public function findWithRelations(string $id)
    {
        return $this->model->with(['currency', 'salesType'])->find($id);
    }

}
