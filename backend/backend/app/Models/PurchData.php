<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchData extends Model
{
    use HasFactory;

    protected $table = 'purch_data';

    protected $fillable = [
        'supplier_id',
        'stock_id',
        'price',
        'suppliers_uom',
        'conversion_factor',
        'supplier_description',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
