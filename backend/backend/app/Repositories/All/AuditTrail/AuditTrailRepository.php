<?php

namespace App\Repositories\All\AuditTrail;

use App\Models\AuditTrail;
use App\Repositories\Base\BaseRepository;

class AuditTrailRepository extends BaseRepository implements AuditTrailInterface
{
    public function __construct(AuditTrail $model)
    {
        parent::__construct($model);
    }
}
