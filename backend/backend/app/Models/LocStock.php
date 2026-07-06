<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocStock extends Model
{
    protected $table = 'loc_stock';

    protected $primaryKey = ['loc_code', 'stock_id'];
    public $incrementing = false;
    public $timestamps = true;
    protected $keyType = 'string';

    protected $fillable = [
        'loc_code',
        'stock_id',
        'reorder_level',
        'quantity',
    ];

    // Relationships
    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'loc_code', 'loc_code');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
