<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuppAllocation extends Model
{
    use HasFactory;

    protected $table = 'supp_allocations';

    protected $fillable = [
        'person_id',
        'amount',
        'date_alloc',
        'trans_no_from',
        'trans_type_from',
        'trans_no_to',
        'trans_type_to',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'person_id', 'supplier_id');
    }

    public function transTypeFrom()
    {
        return $this->belongsTo(TransType::class, 'trans_type_from', 'trans_type');
    }

    public function transTypeTo()
    {
        return $this->belongsTo(TransType::class, 'trans_type_to', 'trans_type');
    }
}
