<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppLanguage extends Model
{
    protected $fillable = ['code', 'name', 'version', 'installed'];

    protected $casts = ['installed' => 'boolean'];
}
