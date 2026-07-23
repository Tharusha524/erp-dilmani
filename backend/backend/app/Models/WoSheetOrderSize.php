<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetOrderSize extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_order_sizes';

    protected $fillable = [
        'wo_sheet_order_id',
        'category',
        'size_label',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(WoSheetOrder::class, 'wo_sheet_order_id');
    }
}
