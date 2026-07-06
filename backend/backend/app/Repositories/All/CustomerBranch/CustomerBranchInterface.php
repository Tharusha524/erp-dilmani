<?php

namespace App\Repositories\All\CustomerBranch;

use App\Repositories\Base\EloquentRepositoryInterface;

interface CustomerBranchInterface extends EloquentRepositoryInterface
{
    // Add any custom methods for cust_branch if needed
    public function allWithRelations();
}
