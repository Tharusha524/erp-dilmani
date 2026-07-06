<?php

namespace App\Repositories\All\PurchasingPricing;

use App\Models\PurchasingPricing;
use App\Repositories\Base\BaseRepository;
use Illuminate\Support\Facades\DB;

class PurchasingPricingRepository extends BaseRepository implements PurchasingPricingInterface
{
    public function __construct(PurchasingPricing $model)
    {
        parent::__construct($model);
    }

    public function deleteByCompositeKey(int $supplierId, string $stockId): bool
    {
        $deleted = DB::table('purchasing_pricing')
            ->where('supplier_id', $supplierId)
            ->where('stock_id', $stockId)
            ->delete();

        return $deleted > 0;
    }

    public function findByCompositeKey($supplier_id, $stock_id)
    {
        return $this->model
            ->where('supplier_id', $supplier_id)
            ->where('stock_id', $stock_id)
            ->first();
    }

    public function allByStockId(string $stockId)
    {
        return $this->model->where('stock_id', $stockId)->get();
    }

    public function updateByCompositeKey($supplier_id, $stock_id, array $data): bool
    {
        $exists = DB::table('purchasing_pricing')
            ->where('supplier_id', $supplier_id)
            ->where('stock_id', $stock_id)
            ->exists();

        if (!$exists) {
            return false;
        }

        DB::table('purchasing_pricing')
            ->where('supplier_id', $supplier_id)
            ->where('stock_id', $stock_id)
            ->update($data);

        return true;
    }
}
