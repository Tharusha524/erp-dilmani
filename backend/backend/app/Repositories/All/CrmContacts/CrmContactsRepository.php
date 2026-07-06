<?php

namespace App\Repositories\All\CrmContacts;

use App\Models\CrmContact;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class CrmContactsRepository extends BaseRepository implements CrmContactsInterface
{
    public function __construct(CrmContact $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with([
            'person',
            'category'
        ])->get();
    }
}
