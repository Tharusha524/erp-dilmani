<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetStatusAssignment extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_status_assignments';

    protected $fillable = [
        'status_id',
        'user_id',
    ];

    public function status()
    {
        return $this->belongsTo(WoSheetStatus::class, 'status_id');
    }
}
