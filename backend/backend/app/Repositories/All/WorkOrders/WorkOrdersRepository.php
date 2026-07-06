<?php

namespace App\Repositories\All\WorkOrders;

use App\Models\WorkOrder;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class WorkOrdersRepository extends BaseRepository implements WorkOrdersInterface
{
    public function __construct(WorkOrder $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->newQuery()
            ->with(['stock:stock_id,description', 'location:loc_code,location_name'])
            ->orderByDesc('id')
            ->get();
    }
}
