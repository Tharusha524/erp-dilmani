<?php

namespace App\Repositories\All\SecurityRoles;

use App\Models\SecurityRole;
use App\Repositories\Base\BaseRepository;

class SecurityRolesRepository extends BaseRepository implements SecurityRolesInterface
{
    public function __construct(SecurityRole $model)
    {
        parent::__construct($model);
    }
}
