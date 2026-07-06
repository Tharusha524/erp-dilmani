<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BudgetTrans extends Model
{
    protected $table = 'budget_trans';

    protected $fillable = [
        'fiscal_year_id',
        'account',
        'dimension_id',
        'dimension2_id',
        'tran_date',
        'amount',
    ];

    protected $casts = [
        'tran_date' => 'date',
        'amount' => 'float',
    ];
}
