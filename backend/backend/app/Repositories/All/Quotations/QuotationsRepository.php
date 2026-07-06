<?php

namespace App\Repositories\All\Quotations;

use App\Repositories\Base\BaseRepository;
use App\Models\Quotation;

class QuotationsRepository extends BaseRepository implements QuotationsInterface
{
    public function __construct(Quotation $model)
    {
        parent::__construct($model);
    }
}
