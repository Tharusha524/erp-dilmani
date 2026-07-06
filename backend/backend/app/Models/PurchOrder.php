<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchOrder extends Model
{
    use HasFactory;

    protected $table = 'purch_orders';
    protected $primaryKey = 'order_no';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'order_no',
        'supplier_id',
        'comments',
        'ord_date',
        'reference',
        'requisition_no',
        'into_stock_location',
        'delivery_address',
        'total',
        'prep_amount',
        'alloc',
        'tax_included'
    ];

    protected $casts = [
        'tax_included' => 'boolean',
        'total' => 'decimal:2',
        'prep_amount' => 'decimal:2',
        'alloc' => 'decimal:2',
        'ord_date' => 'date'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function stockLocation()
    {
        return $this->belongsTo(InventoryLocation::class,'into_stock_location','loc_code');
    }

    public function details()
    {
        return $this->hasMany(PurchOrderDetail::class, 'order_no', 'order_no');
    }

    public function grnBatches()
    {
        return $this->hasMany(GrnBatch::class, 'purch_order_no', 'order_no');
    }
}
