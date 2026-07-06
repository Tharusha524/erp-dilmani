<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bom extends Model
{
    use HasFactory;

    protected $table = 'bom';

    protected $fillable = [
        'parent',
        'component',
        'work_centre',
        'loc_code',
        'quantity',
    ];

    public function parentItem()
    {
        return $this->belongsTo(StockMaster::class, 'parent', 'stock_id');
    }

    public function componentItem()
    {
        return $this->belongsTo(StockMaster::class, 'component', 'stock_id');
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
