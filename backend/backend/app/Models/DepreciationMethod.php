<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepreciationMethod extends Model
{
    protected $table = 'depreciation_method';
    protected $fillable = [
        'type',
        'description',
    ];
}
