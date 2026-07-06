<?php

namespace App\Repositories\All\PaymentTerm;

use App\Models\PaymentTerm;
use App\Repositories\Base\BaseRepository;
use Illuminate\Database\Eloquent\Collection;

class PaymentTermRepository extends BaseRepository implements PaymentTermInterface
{
    public function __construct(PaymentTerm $model)
    {
        parent::__construct($model);
    }

    public function all(): Collection
    {
        return $this->model->with([
            'paymentType'
        ])->get();
    }
}
