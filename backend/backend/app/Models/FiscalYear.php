<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FiscalYear extends Model
{
    protected $table = 'fiscal_years';
    
    protected $fillable = [
        'fiscal_year_from',
        'fiscal_year_to',
        'closed',
    ];

    protected $casts = [
        'closed' => 'boolean',
    ];

    public function companySetup()
    {
        return $this->hasMany(CompanySetup::class, 'fiscal_year_id');
    }

    public function auditTrails()
    {
        return $this->hasMany(AuditTrail::class, 'fiscal_year', 'id');
    }
}
