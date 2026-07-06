<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SysPrefs extends Model
{
    protected $table = 'sys_prefs';
    protected $primaryKey = 'name';
    public $incrementing = false; // since primary key is string

    protected $fillable = [
        'name',
        'category',
        'type',
        'length',
        'value',
    ];
}
