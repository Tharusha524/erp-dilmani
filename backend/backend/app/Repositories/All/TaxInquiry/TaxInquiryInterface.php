<?php

namespace App\Repositories\All\TaxInquiry;

use App\Repositories\Base\EloquentRepositoryInterface;

interface TaxInquiryInterface extends EloquentRepositoryInterface
{
    public function search(array $filters);
}
