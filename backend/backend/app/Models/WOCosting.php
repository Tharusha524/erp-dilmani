<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WOCosting extends Model
{
    use HasFactory;

    protected $table = 'wo_costing';

    protected $fillable = [
        'workorder_id',
        'cost_type',
        'trans_type',
        'trans_no',
        'factor',
    ];

    public function workorder()
    {
        return $this->belongsTo(Workorder::class, 'workorder_id');
    }

    public function transType()
    {
        return $this->belongsTo(TransType::class, 'trans_type', 'trans_type');
    }
}
