<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemTaxTypeException extends Model
{
    use HasFactory;

    protected $table = 'item_tax_type_exceptions';

    protected $fillable = [
        'item_tax_type_id',
        'tax_type_id',
    ];

    /**
     * Get the ItemTaxType this exemption belongs to.
     */
    public function itemTaxType()
    {
        return $this->belongsTo(ItemTaxTypes::class, 'item_tax_type_id');
    }

    /**
     * Get the TaxType this exemption belongs to.
     */
    public function taxType()
    {
        return $this->belongsTo(TaxType::class, 'tax_type_id');
    }
}
