<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlTrans extends Model
{
    use HasFactory;

    protected $table = 'gl_trans';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'type',
        'reference',
        'date',
        'account',
        'cost_center_id',
        'debit',
        'credit',
        'memo',
    ];

    protected $casts = [
        'date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];
}
