<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransTaxDetail extends Model
{
    // Table name starts with a number → must define manually
    protected $table = 'trans_tax_details';

    // No created_at / updated_at columns
    public $timestamps = false;

    // Primary key
    protected $primaryKey = 'id';

    // Mass assignable fields
    protected $fillable = [
        'trans_type',
        'trans_no',
        'tran_date',
        'tax_type_id',
        'rate',
        'ex_rate',
        'included_in_price',
        'net_amount',
        'amount',
        'memo',
        'reg_type',
    ];

    // Type casting
    protected $casts = [
        'tran_date' => 'date',
        'included_in_price' => 'boolean',
        'rate' => 'float',
        'ex_rate' => 'float',
        'net_amount' => 'float',
        'amount' => 'float',
    ];
}
