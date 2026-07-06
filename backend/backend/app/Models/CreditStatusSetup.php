<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditStatusSetup extends Model
{   
     use HasFactory;
     protected $table = 'credit_status_setups';

    protected $fillable = [
        'reason_description',
        'disallow_invoices',
        'inactive',
    ];

    public function debtors()
    {
        return $this->hasMany(DebtorsMaster::class, 'credit_status', 'id');
    }

}
