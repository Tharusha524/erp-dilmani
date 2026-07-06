<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $table = 'bank_accounts';

    protected $fillable = [
        'bank_account_name',
        'account_type',
        'bank_curr_code',
        'default_curr_act',
        'account_gl_code',
        'bank_charges_act',
        'bank_name',
        'bank_account_number',
        'bank_address',
        'last_reconciled_date',
        'ending_reconcile_balance',
        'inactive',
    ];

    protected $casts = [
        'default_curr_act' => 'boolean',
        'inactive' => 'boolean',
        'last_reconciled_date' => 'datetime',
    ];

    public function accountType()
    {
        return $this->belongsTo(AccountType::class, 'account_type', 'id');
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class, 'bank_curr_code', 'currency_abbreviation');
    }

    public function accountGl()
    {
        return $this->belongsTo(ChartMaster::class, 'account_gl_code', 'account_code');
    }

    public function bankChargesAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'bank_charges_act', 'account_code');
    }
}
