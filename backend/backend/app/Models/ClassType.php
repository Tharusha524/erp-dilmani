<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassType extends Model
{
    use HasFactory;

    protected $table = 'class_types';

    protected $fillable = ['type_name'];

    public function chartClasses()
    {
        return $this->hasMany(ChartClass::class, 'ctype', 'id');
    }
}
