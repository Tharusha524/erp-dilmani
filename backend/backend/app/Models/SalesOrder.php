<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrder extends Model
{
    use HasFactory;

    protected $table = 'sales_orders';
    protected $primaryKey = 'order_no';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'order_no', 'trans_type', 'version', 'type',
        'debtor_no', 'branch_code',
        'reference', 'customer_ref', 'comments',
        'ord_date', 'order_type',
        'ship_via', 'delivery_address',
        'contact_phone', 'contact_email',
        'deliver_to', 'freight_cost',
        'from_stk_loc', 'delivery_date',
        'payment_terms',
        'total', 'prep_amount', 'alloc'
    ];


    public function transType()
    {
        return $this->belongsTo(TransType::class, 'trans_type', 'trans_type');
    }

    public function debtor()
    {
        return $this->belongsTo(DebtorsMaster::class, 'debtor_no', 'debtor_no');
    }

    public function branch()
    {
        return $this->belongsTo(CustomerBranch::class, 'branch_code', 'branch_code');
    }

    public function orderType()
    {
        return $this->belongsTo(SalesType::class, 'order_type', 'id');
    }

    public function shipper()
    {
        return $this->belongsTo(ShippingCompany::class, 'ship_via', 'shipper_id');
    }

    public function stockLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'from_stk_loc', 'loc_code');
    }

    public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'terms_indicator');
    }

    public function details()
    {
        return $this->hasMany(SalesOrderDetail::class, 'order_no', 'order_no');
    }
}
