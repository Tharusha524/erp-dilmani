<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';
    protected $primaryKey = 'supplier_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'supp_name',
        'supp_short_name',
        'gst_no',
        'website',
        'curr_code',
        'tax_group',
        'supp_account_no',
        'bank_account',
        'credit_limit',
        'payment_terms',
        'tax_included',
        'payable_account',
        'purchase_account',
        'payment_discount_account',
        'contact',
        'dimension_id',
        'dimension2_id',
        'mail_address',
        'bill_address',
        'notes',
        'inactive',
    ];

    protected $casts = [
        'tax_included' => 'boolean',
        'inactive' => 'boolean',
    ];

    public function currency()
    {
        return $this->belongsTo(Currency::class, 'curr_code', 'currency_abbreviation');
    }

    public function taxGroup()
    {
        return $this->belongsTo(TaxGroup::class, 'tax_group', 'id');
    }

    public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'terms_indicator');
    }

    public function payableAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'payable_account', 'account_code');
    }

    public function purchaseAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'purchase_account', 'account_code');
    }

    public function paymentDiscountAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'payment_discount_account', 'account_code');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchOrder::class,'supplier_id','supplier_id');
    }

    public function grnBatches()
    {
        return $this->hasMany(GrnBatch::class, 'supplier_id', 'supplier_id');
    }

    public function suppAllocations()
    {
        return $this->hasMany(SuppAllocation::class, 'person_id', 'supplier_id');
    }

    public function purchData()
    {
        return $this->hasMany(PurchData::class, 'supplier_id', 'supplier_id');
    }
}
