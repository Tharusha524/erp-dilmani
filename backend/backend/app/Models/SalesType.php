<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesType extends Model
{
    use HasFactory;

    protected $table = 'sales_types';

    protected $fillable = [
        'typeName',
        'factor',
        'taxIncl',
        'status'
    ];

    protected $casts = [
        'factor' => 'decimal:1',
        'taxIncl' => 'boolean',
    ];

    public function salesPricing()
    {
        return $this->hasMany(SalesPricing::class);
    }

    public function companiesUsingAsBasePrice()
    {
        return $this->hasMany(CompanySetup::class, 'base_auto_price_calculation');
    }

    public function debtors()
    {
        return $this->hasMany(DebtorsMaster::class, 'sales_type', 'id');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'order_type', 'id');
    }
}
