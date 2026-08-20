<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalServiceInvoiceLine extends Model
{
    protected $fillable = [
        'invoice_id',
        'stock_id',
        'quantity',
        'unit_price',
        'discount_percent',
        'description',
    ];

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'discount_percent' => 'float',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(InternalServiceInvoice::class, 'invoice_id');
    }
}
