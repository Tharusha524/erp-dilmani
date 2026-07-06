<?php

namespace App\Repositories\All\StockMoves;

use App\Models\StockMove;
use App\Repositories\Base\BaseRepository;

class StockMovesRepository extends BaseRepository implements StockMovesInterface
{
    public function __construct(StockMove $model)
    {
        parent::__construct($model);
    }
}
