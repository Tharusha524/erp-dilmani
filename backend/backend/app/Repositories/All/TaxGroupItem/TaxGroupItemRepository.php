<?php

namespace App\Repositories\All\TaxGroupItem;

use App\Models\TaxGroupItem;
use App\Repositories\Base\BaseRepository;
use Illuminate\Support\Facades\Log;

class TaxGroupItemRepository extends BaseRepository implements TaxGroupItemInterface
{
    public function __construct(TaxGroupItem $model)
    {
        parent::__construct($model);
    }

    public function deleteByCompositeKey(int $tax_group_id, int $tax_type_id): bool
    {
        // First verify if the record exists
        $exists = $this->model->where('tax_group_id', $tax_group_id)
                            ->where('tax_type_id', $tax_type_id)
                            ->exists();
                            
        Log::info('Attempting to delete tax group item', [
            'tax_group_id' => $tax_group_id,
            'tax_type_id' => $tax_type_id,
            'exists' => $exists
        ]);

        if (!$exists) {
            return false;
        }

        return $this->model->where('tax_group_id', $tax_group_id)
                          ->where('tax_type_id', $tax_type_id)
                          ->delete() > 0;
    }

    
}
