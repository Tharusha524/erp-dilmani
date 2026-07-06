<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DebtorTransDetail extends Model
{
    use HasFactory;

    protected $table = 'debtor_trans_details';

    protected $fillable = [
        'debtor_trans_no',
        'debtor_trans_type',
        'stock_id',
        'description',
        'unit_price',
        'unit_tax',
        'quantity',
        'discount_percent',
        'standard_cost',
        'qty_done',
        'src_id'
    ];
}
