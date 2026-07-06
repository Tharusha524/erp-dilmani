<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlType extends Model
{
    use HasFactory;

    protected $table = 'gl_types'; // table name

    protected $fillable = [
        'type',
    ];
}
