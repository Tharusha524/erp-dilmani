<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WOIssueItem extends Model
{
    use HasFactory;

    protected $table = 'wo_issue_items';

    protected $fillable = [
        'stock_id',
        'issue_id',
        'qty_issued',
        'unit_cost',
    ];

    public function issue()
    {
        return $this->belongsTo(WOIssue::class, 'issue_id', 'issue_no');
    }

    public function stock()
    {
        return $this->belongsTo(StockMaster::class, 'stock_id', 'stock_id');
    }
}
