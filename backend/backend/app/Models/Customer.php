<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'customer_name',
        'customer_short_name',
        'address',
        'gst_number',
        'currency',
        'sales_type',
        'phone',
        'secondary_phone',
        'email',
        'bank_account',
        'sales_person',
        'discount_percent',
        'prompt_payment_discount',
        'credit_limit',
        'payment_terms',
        'credit_status',
        'general_notes',
        'default_inventory_location',
        'default_shipping_company',
        'sales_area',
        'tax_group'
    ];
}
