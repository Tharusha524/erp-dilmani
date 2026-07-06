<?php

namespace App\Repositories\All\QuotationDetails;

use App\Repositories\Base\BaseRepository;
use App\Models\QuotationDetail;

class QuotationDetailsRepository extends BaseRepository implements QuotationDetailsInterface
{
    public function __construct(QuotationDetail $model)
    {
        parent::__construct($model);
    }
}
