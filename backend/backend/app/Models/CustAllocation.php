<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustAllocation extends Model
{
    protected $table = 'cust_allocations';
    protected $fillable = [
        'person_id',
        'amt',
        'date_alloc',
        'trans_no_from',
        'trans_type_from',
        'trans_no_to',
        'trans_type_to',
    ];

    public function debtor()
    {
        return $this->belongsTo(
            DebtorsMaster::class,
            'person_id',
            'debtor_no'
        );
    }

    // // From transaction (debtor_trans)
    // public function fromTransaction()
    // {
    //     return $this->belongsTo(
    //         DebtorTrans::class,
    //         'trans_no_from',
    //         'trans_no'
    //     )->whereColumn(
    //         'cust_allocations.trans_type_from',
    //         'debtor_trans.trans_type'
    //     );
    // }

    // // To transaction (sales_orders)
    // public function toSalesOrder()
    // {
    //     return $this->belongsTo(
    //         SalesOrder::class,
    //         'trans_no_to',
    //         'order_no'
    //     )->whereColumn(
    //         'cust_allocations.trans_type_to',
    //         'sales_orders.trans_type'
    //     );
    // }
}
