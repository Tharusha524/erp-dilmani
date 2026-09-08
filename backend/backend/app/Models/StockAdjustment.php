<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAdjustment extends Model
{
    protected $table = 'stock_adjustments';

    protected $fillable = [
        'stock_id', 'loc_code', 'movement_type', 'quantity_before',
        'quantity_moved', 'quantity_after', 'reason', 'notes', 'recorded_by',
    ];

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }

    /**
     * Named "recordedByUser" (not "recordedBy") so its serialized JSON key
     * is "recorded_by_user" — avoids clashing with the existing scalar
     * "recorded_by" column (the raw user id) when this is eager-loaded.
     */
    public function recordedByUser()
    {
        return $this->belongsTo(UserManagement::class, 'recorded_by');
    }
}
