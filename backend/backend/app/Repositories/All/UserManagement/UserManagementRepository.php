<?php

namespace App\Repositories\All\UserManagement;

use App\Models\UserManagement;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class UserManagementRepository extends BaseRepository implements UserManagementInterface
{
    public function __construct(UserManagement $model)
    {
        parent::__construct($model);
    }

    // Example override: eager-load
    public function all(): Collection
    {
        return $this->model->select([
            'id','first_name','last_name','department','epf',
            'telephone','address','email','role','image', 'status'
        ])->get();
    }

    public function find(mixed $id): ?Model
    {
        return $this->model->find($id);
    }
}
