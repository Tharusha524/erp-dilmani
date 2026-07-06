<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DebtorTrans extends Model
{
    use HasFactory;

    protected $table = 'debtor_trans';

    protected $fillable = [
        'trans_no',
        'trans_type',
        'version',
        'debtor_no',
        'branch_code',
        'tran_date',
        'due_date',
        'reference',
        'tpe',
        'order_no',
        'ov_amount',
        'ov_gst',
        'ov_freight',
        'ov_freight_tax',
        'ov_discount',
        'alloc',
        'prep_amount',
        'rate',
        'ship_via',
        'dimension_id',
        'dimension2_id',
        'payment_terms',
        'tax_included',
        'write_off_account',
    ];

    public function debtor()
    {
        return $this->belongsTo(DebtorsMaster::class, 'debtor_no', 'debtor_no');
    }

    public function branch()
    {
        return $this->belongsTo(CustomerBranch::class, 'branch_code', 'branch_code');
    }

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'order_no', 'order_no');
    }

    public function transType()
    {
        return $this->belongsTo(TransType::class, 'trans_type', 'trans_type');
    }

    public function shipper()
    {
        return $this->belongsTo(ShippingCompany::class, 'ship_via', 'shipper_id');
    }

    public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class, 'payment_terms', 'terms_indicator');
    }

    public function bankTransactions()
    {
        return $this->hasMany(BankTrans::class, 'trans_no', 'trans_no')
                    ->whereColumn('bank_trans.type', 'debtor_trans.trans_type');
    }
}
