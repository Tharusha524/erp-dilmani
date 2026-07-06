<?php

namespace App\Repositories\All\CompanySetup;

use App\Repositories\Base\EloquentRepositoryInterface;

interface CompanySetupInterface extends EloquentRepositoryInterface
{
    public function allWithRelations();
}