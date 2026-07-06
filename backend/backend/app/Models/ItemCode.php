<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemCode extends Model
{
    use HasFactory;

    protected $table = 'item_codes';

    protected $fillable = [
        'item_code',
        'stock_id',
        'description',
        'category_id',
        'quantity',
        'is_foreign',
        'inactive',
    ];

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id', 'category_id');
    }
}
