<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxGroupItem extends Model
{
    use HasFactory;

    protected $table = 'tax_group_items'; 

    protected $fillable = [
        'tax_group_id',
        'tax_type_id',
        'tax_shipping',
    ];

    public $timestamps = false;

    public function taxGroup()
    {
        return $this->belongsTo(TaxGroup::class, 'tax_group_id');
    }

    public function taxType()
    {
        return $this->belongsTo(TaxType::class, 'tax_type_id');
    }
}
