<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetEvent extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_events';

    protected $fillable = [
        'wo_sheet_order_id',
        'event_type',
        'description',
        'status_id',
        'user_id',
        'event_datetime',
    ];

    protected $casts = [
        'event_datetime' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(WoSheetOrder::class, 'wo_sheet_order_id');
    }

    public function status()
    {
        return $this->belongsTo(WoSheetStatus::class, 'status_id');
    }
}
