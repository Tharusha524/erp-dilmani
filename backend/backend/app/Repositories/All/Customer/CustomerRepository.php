<?php

namespace App\Repositories\All\Customer;

use App\Models\Customer;
use App\Repositories\Base\BaseRepository;

class CustomerRepository extends BaseRepository implements CustomerInterface
{
    public function __construct(Customer $model)
    {
        parent::__construct($model);
    }

    // Add Customer-specific query methods here if necessary
}
