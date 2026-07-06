<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecurrentInvoice extends Model
{
    protected $table = 'recurrent_invoices';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'description',
        'order_no',
        'debtor_no',
        'group_no',
        'days',
        'monthly',
        'begin',
        'end',
        'last_sent',
        'last_invoice_trans_no',
        'last_invoice_reference',
    ];

    protected $casts = [
        'order_no'  => 'integer',
        'debtor_no' => 'integer',
        'group_no'  => 'integer',
        'days'      => 'integer',
        'monthly'   => 'integer',
        'begin'     => 'date',
        'end'       => 'date',
        'last_sent' => 'date',
    ];
}
