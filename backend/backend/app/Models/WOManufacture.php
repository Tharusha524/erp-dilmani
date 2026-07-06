<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WOManufacture extends Model
{
    use HasFactory;

    protected $table = 'wo_manufacture';

    protected $fillable = [
        'reference',
        'workorder_id',
        'quantity',
        'date',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function workorder()
    {
        return $this->belongsTo(WorkOrder::class, 'workorder_id');
    }
}
