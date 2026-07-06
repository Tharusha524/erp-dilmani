<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransType extends Model
{
    use HasFactory;

    protected $table = 'trans_types';

    protected $fillable = [
        'trans_type',
        'description',
    ];

    function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'trans_type', 'trans_type');
    }

    public function salesOrderDetails()
    {
        return $this->hasMany(SalesOrderDetail::class, 'trans_type', 'trans_type');
    }

    public function allocationsFrom()
    {
        return $this->hasMany(SuppAllocation::class, 'trans_type_from', 'trans_type');
    }

    public function allocationsTo()
    {
        return $this->hasMany(SuppAllocation::class, 'trans_type_to', 'trans_type');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'type', 'trans_type');
    }

    public function woCostings()
    {
        return $this->hasMany(WOCosting::class, 'trans_type', 'trans_type');
    }
}