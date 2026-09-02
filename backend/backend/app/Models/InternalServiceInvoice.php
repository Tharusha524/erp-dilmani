<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternalServiceInvoice extends Model
{
    protected $fillable = [
        'debtor_no',
        'branch_code',
        'tran_date',
        'due_date',
        'order_type',
        'ship_via',
        'payment_terms',
        'freight_cost',
        'from_stk_loc',
        'customer_ref',
        'cost_center_id',
        'delivery_address',
        'deliver_to',
        'comments',
        'reference',
        'cash_sale',
        'bank_account_id',
        'advance_amount',
        'balance_due',
        'created_by',
    ];

    protected $casts = [
        'cash_sale' => 'boolean',
        'freight_cost' => 'float',
        'advance_amount' => 'float',
        'balance_due' => 'float',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(InternalServiceInvoiceLine::class, 'invoice_id');
    }
}
