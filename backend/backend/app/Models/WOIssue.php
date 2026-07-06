<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WOIssue extends Model
{
    use HasFactory;

    protected $table = 'wo_issues';
    protected $primaryKey = 'issue_no';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'issue_no',
        'workorder_id',
        'reference',
        'issue_date',
        'loc_code',
        'work_centre',
    ];

    public function workorder()
    {
        return $this->belongsTo(WorkOrder::class, 'workorder_id');
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'loc_code', 'loc_code');
    }

    public function workCentre()
    {
        return $this->belongsTo(WorkCentre::class, 'work_centre');
    }

    public function items()
    {
        return $this->hasMany(WOIssueItem::class, 'issue_id', 'issue_no');
    }
}
