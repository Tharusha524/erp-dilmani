<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingCompany extends Model
{
    use HasFactory;

    protected $table = 'shipping_companies';
    protected $primaryKey = 'shipper_id';

    protected $fillable = [
        'shipper_name',
        'phone',
        'phone2',
        'contact',
        'address',
        'inactive',
    ];

    public function branches()
    {
        return $this->hasMany(CustomerBranch::class, 'shipping_company', 'shipper_id');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'ship_via', 'shipper_id');
    }
}
