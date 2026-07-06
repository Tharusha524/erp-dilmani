<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemTaxTypes extends Model
{
    protected $table = 'item_tax_types';

    protected $fillable = [
        'name',
        'exempt',
        'inactive',
    ];
}
