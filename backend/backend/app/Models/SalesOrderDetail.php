<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderDetail extends Model
{
    use HasFactory;

    protected $table = 'sales_order_details';

    protected $fillable = [
        'order_no',
        'trans_type',
        'stk_code',
        'description',
        'qty_sent',
        'unit_price',
        'quantity',
        'invoiced',
        'discount_percent',
    ];

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'order_no', 'order_no');
    }

    public function transType()
    {
        return $this->belongsTo(TransType::class, 'trans_type', 'trans_type');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stk_code', 'stock_id');
    }
}
