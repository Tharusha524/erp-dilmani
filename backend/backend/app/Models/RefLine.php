<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefLine extends Model
{
    use HasFactory;

    protected $table = 'reflines';

    protected $fillable = [
        'trans_type',
        'prefix',
        'pattern',
        'memo',
        'default',
        'inactive',
    ];

    protected $casts = [
        'default' => 'boolean',
        'inactive' => 'boolean',
    ];

    public function journals()
    {
        return $this->hasMany(Journal::class, 'type', 'trans_type');
    }

    public function refs()
    {
        return $this->hasMany(Ref::class, 'type', 'trans_type');
    }

    public function auditTrails()
    {
        return $this->hasMany(AuditTrail::class, 'type', 'trans_type');
    }

    public function stockMoves()
    {
        return $this->hasMany(StockMove::class, 'type', 'trans_type');
    }

    public function Comments()
    {
        return $this->hasMany(Comment::class, 'type', 'trans_type');
    }
}