<?php

namespace App\Repositories\All\GlTrans;

use App\Repositories\Base\EloquentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface GlTransInterface extends EloquentRepositoryInterface
{
    public function search(array $filters);

    public function findForTransaction(array $filters);
}
