<?php

namespace App\Repositories\All\BankAccount;


use App\Models\BankAccount;
use App\Repositories\All\BankAccount\BankAccountInterface;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class BankAccountRepository extends BaseRepository implements BankAccountInterface
{
    public function __construct(BankAccount $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with([
            'accountType',
            'currency',
            'accountGl',
            'bankChargesAccount',
        ])->get();
    }
}
