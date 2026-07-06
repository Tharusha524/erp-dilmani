<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditTrail extends Model
{
    use HasFactory;

    protected $table = 'audit_trail';

    protected $fillable = [
        'type',
        'trans_no',
        'user',
        'stamp',
        'description',
        'fiscal_year',
        'gl_date',
        'gl_seq',
    ];

    public function fiscalYear()
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year', 'id');
    }

    public function refLine()
    {
        return $this->belongsTo(RefLine::class, 'type', 'trans_type');
    }
}