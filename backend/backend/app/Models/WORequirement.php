<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WORequirement extends Model
{
    use HasFactory;

    protected $table = 'wo_requirements';

    protected $fillable = [
        'workorder_id',
        'stock_id',
        'work_centre',
        'units_req',
        'unit_cost',
        'loc_code',
        'units_issued'
    ];

    public function workorder()
    {
        return $this->belongsTo(Workorder::class, 'workorder_id');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }

    public function workCentre()
    {
        return $this->belongsTo(WorkCentre::class, 'work_centre');
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'loc_code', 'loc_code');
    }
}
