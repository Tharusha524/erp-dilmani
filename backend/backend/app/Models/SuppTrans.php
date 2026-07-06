<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuppTrans extends Model
{
    use HasFactory;

    protected $table = 'supp_trans';

    protected $fillable = [
        'trans_no',
        'trans_type',
        'supplier_id',
        'reference',
        'supp_reference',
        'trans_date',
        'due_date',
        'ov_amount',
        'ov_discount',
        'ov_gst',
        'rate',
        'alloc',
        'tax_included'
    ];

    public function transType()
    {
        return $this->belongsTo(TransType::class, 'trans_type', 'trans_type');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function suppInvoiceItems()
    {
        return $this->hasMany(SuppInvoiceItem::class, 'supp_trans_no', 'trans_no');
    }
}
