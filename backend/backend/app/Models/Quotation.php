<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    protected $table = 'quotations';
    protected $primaryKey = 'quotation_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'quotation_number',
        'trans_type',
        'debtor_no',
        'branch_code',
        'reference',
        'customer_ref',
        'comments',
        'quotation_date',
        'delivery_date',
        'ship_via',
        'delivery_address',
        'contact_phone',
        'contact_email',
        'freight_cost',
        'from_stk_loc',
        'payment_terms',
        'total',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'quotation_date' => 'datetime',
        'delivery_date' => 'datetime',
        'trans_type' => 'integer',
        'debtor_no' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'freight_cost' => 'decimal:2',
        'total' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
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
        return $this->hasMany(QuotationDetail::class, 'quotation_id', 'quotation_id');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }
}
