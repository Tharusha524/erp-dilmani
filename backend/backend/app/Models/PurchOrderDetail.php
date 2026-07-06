<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchOrderDetail extends Model
{
    use HasFactory;

    protected $table = 'purch_order_details';
    protected $primaryKey = 'po_detail_item';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'order_no',
        'item_code',
        'description',
        'delivery_date',
        'qty_invoiced',
        'unit_price',
        'discount_percent',
        'act_price',
        'std_cost_unit',
        'quantity_ordered',
        'quantity_received'
    ];

    public function purchOrder()
    {
        return $this->belongsTo(PurchOrder::class, 'order_no', 'order_no');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockMaster::class, 'item_code', 'stock_id');
    }

    public function grnItems()
    {
        return $this->hasMany(GrnItem::class, 'po_detail_item', 'po_detail_item');
    }

    public function suppInvoiceItems()
    {
        return $this->hasMany(SuppInvoiceItem::class, 'po_detail_item_id', 'po_detail_item');
    }
}
