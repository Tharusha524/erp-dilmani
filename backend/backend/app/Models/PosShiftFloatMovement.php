<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosShiftFloatMovement extends Model
{
    protected $table = 'pos_shift_float_movements';

    protected $fillable = [
        'pos_shift_id',
        'type',
        'amount',
        'reason',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function shift()
    {
        return $this->belongsTo(PosShift::class, 'pos_shift_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(UserManagement::class, 'recorded_by');
    }
}
