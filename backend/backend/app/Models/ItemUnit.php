<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemUnit extends Model
{
    use HasFactory;

    protected $table = 'item_units';

    protected $fillable = [
        'abbr',
        'name',
        'decimals',
        'inactive',
    ];
}
