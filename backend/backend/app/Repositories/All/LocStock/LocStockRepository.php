<?php

namespace App\Repositories\All\LocStock;

use App\Models\LocStock;
use App\Repositories\Base\BaseRepository;
use Illuminate\Support\Facades\DB;

class LocStockRepository extends BaseRepository implements LocStockInterface
{
    public function __construct(LocStock $model)
    {
        parent::__construct($model);
    }

    public function deleteByCompositeKey(string $locCode, string $stockId): bool
    {
        $deleted = DB::table('loc_stock')
            ->where('loc_code', $locCode)
            ->where('stock_id', $stockId)
            ->delete();

        return $deleted > 0;
    }

    public function findByCompositeKey(string $locCode, string $stockId)
    {
        return $this->model
            ->where('loc_code', $locCode)
            ->where('stock_id', $stockId)
            ->first();
    }

    public function updateByCompositeKey(string $locCode, string $stockId, array $data): bool
    {
        $exists = DB::table('loc_stock')
            ->where('loc_code', $locCode)
            ->where('stock_id', $stockId)
            ->exists();

        if (!$exists) {
            return false;
        }

        DB::table('loc_stock')
            ->where('loc_code', $locCode)
            ->where('stock_id', $stockId)
            ->update($data);

        return true;
    }
}
