<?php

namespace App\Repositories\All\BankTransInquiry;

use App\Repositories\Base\EloquentRepositoryInterface;

interface BankTransInquiryInterface extends EloquentRepositoryInterface
{
    public function search(array $filters): array;
}
