<?php

namespace App\Repositories\All\TaxAlgorithm;

use App\Models\TaxAlgorithm;
use App\Repositories\Base\BaseRepository;

class TaxAlgorithmRepository extends BaseRepository implements TaxAlgorithmInterface
{
    public function __construct(TaxAlgorithm $model)
    {
        parent::__construct($model);
    }
}
