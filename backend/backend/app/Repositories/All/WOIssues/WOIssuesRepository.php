<?php

namespace App\Repositories\All\WOIssues;

use App\Models\WOIssue;
use App\Repositories\Base\BaseRepository;

class WOIssuesRepository extends BaseRepository implements WOIssuesInterface
{
    public function __construct(WOIssue $model)
    {
        parent::__construct($model);
    }
}
