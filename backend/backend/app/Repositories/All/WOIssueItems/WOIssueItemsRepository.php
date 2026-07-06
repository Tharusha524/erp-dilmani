<?php

namespace App\Repositories\All\WOIssueItems;

use App\Models\WoIssueItem;
use App\Repositories\Base\BaseRepository;

class WOIssueItemsRepository extends BaseRepository implements WOIssueItemsInterface
{
    public function __construct(WOIssueItem $model)
    {
        parent::__construct($model);
    }
}
