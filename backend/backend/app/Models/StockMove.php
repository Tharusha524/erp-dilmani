<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMove extends Model
{
    use HasFactory;

    protected $primaryKey = 'trans_id';
    public $incrementing = true;

    protected $fillable = [
        'trans_no',
        'stock_id',
        'type',
        'loc_code',
        'tran_date',
        'price',
        'reference',
        'qty',
        'standard_cost',
    ];

    public function stockMaster()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'loc_code', 'loc_code');
    }

    public function refLine()
    {
        return $this->belongsTo(RefLine::class, 'type', 'trans_type');
    }
}
