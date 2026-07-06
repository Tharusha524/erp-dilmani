<?php

namespace App\Repositories\All\SuppInvoiceItems;

use App\Models\SuppInvoiceItem;
use App\Repositories\Base\BaseRepository;

class SuppInvoiceItemsRepository extends BaseRepository implements SuppInvoiceItemsInterface
{
    public function __construct(SuppInvoiceItem $model)
    {
        parent::__construct($model);
    }
}
