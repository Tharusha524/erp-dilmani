<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecurityRole extends Model
{
    use HasFactory;

    protected $table = 'security_roles';

    protected $fillable = [
        'role',
        'description',
        'sections',
        'areas',
        'inactive',
    ];

    protected $casts = [
        'inactive' => 'boolean',
    ];
}
