<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $table = 'exchange_rates';

    protected $fillable = [
        'curr_code',
        'rate_buy',
        'rate_sell',
        'date',
    ];

    protected $casts = [
        'rate_buy' => 'float',
        'rate_sell' => 'float',
        'date' => 'date',
    ];

    public function currency()
    {
        return $this->belongsTo(Currency::class, 'curr_code', 'currency_abbreviation');
    }
}
