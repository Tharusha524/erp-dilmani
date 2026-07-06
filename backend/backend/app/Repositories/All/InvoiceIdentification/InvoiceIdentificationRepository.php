<?php

namespace App\Repositories\All\InvoiceIdentification;

use App\Models\InvoiceIdentification;
use App\Repositories\Base\BaseRepository;

class InvoiceIdentificationRepository extends BaseRepository implements InvoiceIdentificationInterface
{
    public function __construct(InvoiceIdentification $model)
    {
        parent::__construct($model);
    }
}
