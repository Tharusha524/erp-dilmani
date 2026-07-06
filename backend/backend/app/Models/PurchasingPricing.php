<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchasingPricing extends Model
{
    // Specify the table name explicitly
    protected $table = 'purchasing_pricing';

    // Composite primary key
    protected $primaryKey = ['supplier_id', 'stock_id'];
    public $incrementing = false; // because composite key
    protected $keyType = 'string'; // stock_id is char, supplier_id is int; use string for generality

    // Disable timestamps if not needed
    public $timestamps = false;

    // Mass assignable attributes
    protected $fillable = [
        'supplier_id',
        'stock_id',
        'price',
        'suppliers_uom',
        'conversion_factor',
        'supplier_description',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
