<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrnBatch extends Model
{
    use HasFactory;

    protected $table = 'grn_batch';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'supplier_id',
        'purch_order_no',
        'reference',
        'delivery_date',
        'loc_code',
        'rate'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchOrder::class, 'purch_order_no', 'order_no');
    }

    public function stockLocation()
    {
        return $this->belongsTo(InventoryLocation::class,'loc_code','loc_code');
    }

    public function items()
    {
        return $this->hasMany(GrnItem::class, 'grn_batch_id', 'id');
    }
}
