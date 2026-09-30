<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionalPrice extends Model
{
    protected $table = 'promotional_prices';

    protected $fillable = [
        'stock_id',
        'promo_price',
        'start_date',
        'end_date',
        'active',
    ];

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
