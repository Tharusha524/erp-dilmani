<?php

namespace App\Repositories\All\WORequirements;

use App\Models\WORequirement;
use App\Repositories\Base\BaseRepository;

class WORequirementsRepository extends BaseRepository implements WORequirementsInterface
{
    public function __construct(WORequirement $model)
    {
        parent::__construct($model);
    }
}
