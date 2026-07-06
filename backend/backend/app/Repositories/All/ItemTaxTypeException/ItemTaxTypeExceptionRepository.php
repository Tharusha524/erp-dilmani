<?php

namespace App\Repositories\All\ItemTaxTypeException;

use App\Models\ItemTaxTypeException;
use App\Repositories\Base\BaseRepository;
use Illuminate\Support\Facades\DB;

class ItemTaxTypeExceptionRepository extends BaseRepository implements ItemTaxTypeExceptionInterface
{
    public function __construct(ItemTaxTypeException $model)
    {
        parent::__construct($model);
    }

    public function deleteByCompositeKey(int $itemId, int $taxTypeId): bool
    {
        $deleted = DB::table('item_tax_type_exceptions')
            ->where('item_tax_type_id', $itemId)
            ->where('tax_type_id', $taxTypeId)
            ->delete();

        return $deleted > 0;
    }
}
