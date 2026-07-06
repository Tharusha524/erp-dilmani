<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FaDepreciationBatch extends Model
{
    protected $fillable = [
        'reference',
        'period_date',
        'assets_count',
        'total_amount',
    ];

    protected $casts = [
        'period_date' => 'date',
        'total_amount' => 'float',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(FaDepreciationLine::class, 'batch_id');
    }
}
