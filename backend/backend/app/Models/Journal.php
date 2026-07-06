<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $table = 'journal';
    public $incrementing = false; // because of composite PK

    protected $primaryKey = ['type', 'trans_no']; // Not natively supported but for clarity

    protected $fillable = [
        'type',
        'trans_no',
        'tran_date',
        'reference',
        'source_ref',
        'event_date',
        'doc_date',
        'currency',
        'amount',
        'rate',
    ];

    protected $casts = [
        'tran_date' => 'date',
        'event_date' => 'date',
        'doc_date' => 'date',
    ];

    public function currencyRelation()
    {
        return $this->belongsTo(Currency::class, 'currency', 'currency_abbreviation');
    }

    public function transTypeRelation()
    {
        return $this->belongsTo(RefLine::class, 'type', 'trans_type');
    }
}
