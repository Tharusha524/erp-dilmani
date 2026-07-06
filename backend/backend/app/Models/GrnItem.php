<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrnItem extends Model
{
    use HasFactory;

    protected $table = 'grn_items';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'grn_batch_id',
        'po_detail_item',
        'item_code',
        'description',
        'qty_recd',
        'quantity_inv'
    ];


    public function grnBatch()
    {
        return $this->belongsTo(GrnBatch::class, 'grn_batch_id', 'id');
    }

    public function purchOrderDetail()
    {
        return $this->belongsTo(PurchOrderDetail::class, 'po_detail_item', 'po_detail_item');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockMaster::class, 'item_code', 'stock_id');
    }

    public function suppInvoiceItems()
    {
        return $this->hasMany(SuppInvoiceItem::class, 'grn_item_id');
    }
}
