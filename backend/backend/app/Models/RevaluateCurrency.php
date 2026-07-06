<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RevaluateCurrency extends Model
{
    use HasFactory;

    protected $table = 'revaluate_currencies';

    protected $fillable = [
        'date',
        'memo',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
