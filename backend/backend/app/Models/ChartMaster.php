<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartMaster extends Model
{
    use HasFactory;

    protected $table = 'chart_master';
    protected $primaryKey = 'account_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['account_code', 'account_code2', 'account_name', 'account_type', 'inactive'];

    public function chartType()
    {
        return $this->belongsTo(ChartType::class, 'account_type', 'id');
    }

    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class, 'account_gl_code', 'account_code');
    }

    public function bankChargeAccounts()
    {
        return $this->hasMany(BankAccount::class, 'bank_charges_act', 'account_code');
    }

    public function SalesAccount()
    {
        return $this->hasMany(CustomerBranch::class, 'sales_account', 'account_code');
    }

    public function SalesDiscountAccount()
    {
        return $this->hasMany(CustomerBranch::class, 'sales_discount_account', 'account_code');
    }

    public function ReceivablesAccount()
    {
        return $this->hasMany(CustomerBranch::class, 'receivables_account', 'account_code');
    }

    public function PaymentDiscountAccount()
    {
        return $this->hasMany(CustomerBranch::class, 'payment_discount_account', 'account_code');
    }

    public function TaxTypesAsSalesAccount()
    {
        return $this->hasMany(TaxType::class, 'sales_gl_account', 'account_code');
    }

    public function TaxTypesAsPurchasingAccount()
    {
        return $this->hasMany(TaxType::class, 'purchasing_gl_account', 'account_code');
    }

    public function PayableAccountSuppliers()
    {
        return $this->hasMany(Supplier::class, 'payable_account', 'account_code');
    }

    public function PurchaseAccountSuppliers()
    {
        return $this->hasMany(Supplier::class, 'purchase_account', 'account_code');
    }

    public function PaymentDiscountAccountSuppliers()
    {
        return $this->hasMany(Supplier::class, 'payment_discount_account', 'account_code');
    }
}
