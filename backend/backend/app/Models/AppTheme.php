<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppTheme extends Model
{
    protected $fillable = ['theme_key', 'name', 'version', 'installed'];

    protected $casts = ['installed' => 'boolean'];
}
