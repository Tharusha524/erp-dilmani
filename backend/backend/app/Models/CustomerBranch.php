<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerBranch extends Model
{
    use HasFactory;

    protected $table = 'cust_branch';
    protected $primaryKey = 'branch_code';

    protected $fillable = [
        'debtor_no',
        'br_name',
        'branch_ref',
        'br_address',
        'sales_area',
        'sales_person',
        'inventory_location',
        'tax_group',
        'sales_account',
        'sales_discount_account',
        'receivables_account',
        'payment_discount_account',
        'shipping_company',
        'br_post_address',
        'sales_group',
        'notes',
        'bank_account',
        'inactive',
    ];

    protected $casts = [
        'inactive' => 'boolean',
    ];

    public function debtor()
    {
        return $this->belongsTo(DebtorsMaster::class, 'debtor_no', 'debtor_no');
    }

    public function salesArea()
    {
        return $this->belongsTo(SalesArea::class, 'sales_area', 'id');
    }

    public function salesPerson()
    {
        return $this->belongsTo(SalesPerson::class, 'sales_person', 'id');
    }

    public function inventoryLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'inventory_location', 'loc_code');
    }

    public function taxGroup()
    {
        return $this->belongsTo(TaxGroup::class, 'tax_group', 'id');
    }

    public function shippingCompany()
    {
        return $this->belongsTo(ShippingCompany::class, 'shipping_company', 'shipper_id');
    }

    public function salesGroup()
    {
        return $this->belongsTo(SalesGroup::class, 'sales_group', 'id');
    }

    public function salesAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'sales_account', 'account_code');
    }

    public function salesDiscountAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'sales_discount_account', 'account_code');
    }

    public function receivablesAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'receivables_account', 'account_code');
    }
    
    public function paymentDiscountAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'payment_discount_account', 'account_code');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'branch_code', 'branch_code');
    }
}
