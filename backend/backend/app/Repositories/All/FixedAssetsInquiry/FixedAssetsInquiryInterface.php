<?php

namespace App\Repositories\All\FixedAssetsInquiry;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Support\Collection;

interface FixedAssetsInquiryInterface extends EloquentRepositoryInterface
{
    public function search(array $filters): Collection;

    public function searchMovements(array $filters): Collection;
}
