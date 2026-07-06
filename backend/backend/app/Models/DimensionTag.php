<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DimensionTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'tagName',
        'tagDescription',
    ];
}
