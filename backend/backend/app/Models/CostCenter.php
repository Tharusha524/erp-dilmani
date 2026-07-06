<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostCenter extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'name',
        'type',
        'start_date',
        'date_required_by',
        'tag_id',
        'memo',
        'closed',
    ];

    protected $casts = [
        'start_date' => 'date',
        'date_required_by' => 'date',
        'closed' => 'boolean',
        'type' => 'integer',
    ];

    public function tag(): BelongsTo
    {
        return $this->belongsTo(CostCenterTag::class, 'tag_id');
    }
}
