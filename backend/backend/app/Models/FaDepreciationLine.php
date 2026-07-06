<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaDepreciationLine extends Model
{
    protected $fillable = [
        'batch_id',
        'stock_id',
        'trans_no',
        'tran_date',
        'amount',
        'expense_account',
        'accumulated_account',
        'period_key',
    ];

    protected $casts = [
        'tran_date' => 'date',
        'amount' => 'float',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(FaDepreciationBatch::class, 'batch_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
