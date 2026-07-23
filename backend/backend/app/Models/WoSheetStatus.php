<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetStatus extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_statuses';

    protected $fillable = [
        'name',
        'category',
        'sequence_order',
        'process_type',
        'inactive',
    ];

    protected $casts = [
        'inactive' => 'boolean',
        'sequence_order' => 'integer',
    ];
}
