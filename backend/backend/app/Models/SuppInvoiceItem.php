<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuppInvoiceItem extends Model
{
    use HasFactory;

    protected $table = 'supp_invoice_items';

    protected $fillable = [
        'supp_trans_no',
        'supp_trans_type',
        'gl_code',
        'grn_item_id',
        'po_detail_item_id',
        'stock_id',
        'description',
        'quantity',
        'unit_price',
        'unit_tax',
        'memo',
        'dimension_id',
        'dimension2_id',
    ];

    public function suppTransNo()
    {
        return $this->belongsTo(SuppTrans::class, 'supp_trans_no', 'trans_no');
    }

    public function suppTransType()
    {
        return $this->belongsTo(SuppTrans::class, 'supp_trans_type', 'trans_type');
    }

    public function grnItem()
    {
        return $this->belongsTo(GrnItem::class, 'grn_item_id');
    }

    public function purchOrderDetail()
    {
        return $this->belongsTo(PurchOrderDetail::class, 'po_detail_item_id', 'po_detail_item');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
