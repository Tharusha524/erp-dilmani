<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppExtension extends Model
{
    protected $fillable = ['extension_key', 'name', 'version', 'installed'];

    protected $casts = ['installed' => 'boolean'];
}
