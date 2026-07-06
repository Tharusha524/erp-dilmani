<?php

namespace App\Models;



use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{

     use HasFactory;

    protected $table = 'currencies';

    protected $fillable = [
        'currency_abbreviation',
        'currency_symbol',
        'currency_name',
        'hundredths_name',
        'country',
        'auto_exchange_rate_update',
        'inactive',
    ];


    protected $casts = [
        'auto_exchange_rate_update' => 'boolean',
    ];

    public function salesPricing()
    {
        return $this->hasMany(SalesPricing::class);
    }

    public function companySetup()
    {
        return $this->hasMany(CompanySetup::class, 'home_currency_id');
    }

    public function debtors()
    {
        return $this->hasMany(DebtorsMaster::class, 'curr_code', 'currency_abbreviation');
    }

    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class, 'bank_curr_code', 'currency_abbreviation');
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class, 'curr_code', 'currency_abbreviation');
    }

    public function exchangeRates()
    {
        return $this->hasMany(ExchangeRate::class, 'curr_code', 'currency_abbreviation');
    }

    public function journals()
    {
        return $this->hasMany(Journal::class, 'currency', 'currency_abbreviation');
    }
}