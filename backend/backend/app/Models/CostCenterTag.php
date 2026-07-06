<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CostCenterTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'tagName',
        'tagDescription',
    ];
}
