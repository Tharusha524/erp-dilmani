<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationDetail extends Model
{
    use HasFactory;

    protected $table = 'quotation_details';

    protected $fillable = [
        'quotation_id',
        'trans_type',
        'stk_code',
        'description',
        'quantity',
        'unit_price',
        'discount_percent',
        'line_total'
    ];

    protected $casts = [
        'quotation_id' => 'integer',
        'trans_type' => 'integer',
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'line_total' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');
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
