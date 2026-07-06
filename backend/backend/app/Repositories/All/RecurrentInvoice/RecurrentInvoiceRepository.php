<?php

namespace App\Repositories\All\RecurrentInvoice;

use App\Models\RecurrentInvoice;
use App\Repositories\Base\BaseRepository;

class RecurrentInvoiceRepository extends BaseRepository implements RecurrentInvoiceInterface
{
    public function __construct(RecurrentInvoice $model)
    {
        parent::__construct($model);
    }
}
