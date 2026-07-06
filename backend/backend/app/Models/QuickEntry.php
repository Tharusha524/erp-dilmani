<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuickEntry extends Model
{
    protected $fillable = [
        'name',
        'description',
        'usage',
        'entry_type',
        'base_amount_description',
        'default_base_amount',
        'destination_account',
    ];

    protected $casts = [
        'default_base_amount' => 'float',
    ];
}
