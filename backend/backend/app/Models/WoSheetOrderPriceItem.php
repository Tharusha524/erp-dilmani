<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetOrderPriceItem extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_order_price_items';

    protected $fillable = [
        'wo_sheet_order_id',
        'item_name',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(WoSheetOrder::class, 'wo_sheet_order_id');
    }
}
