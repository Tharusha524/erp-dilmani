<?php

namespace App\Repositories\All\UserProfile;

use App\Models\UserProfile;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class UserProfileRepository extends BaseRepository implements UserProfileInterface
{
    public function __construct(UserProfile $model)
    {
        parent::__construct($model);
    }

    // Example override: eager-load
    public function all(): Collection
    {
        return $this->model->select([
            'id','first_name','last_name','department','epf',
            'telephone','address','email','role','status','image'
        ])->get();
    }

    public function find(mixed $id): ?Model
    {
        return $this->model->find($id);
    }
}
