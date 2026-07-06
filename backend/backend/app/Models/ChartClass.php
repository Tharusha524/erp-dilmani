<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartClass extends Model
{
    use HasFactory;

    protected $table = 'chart_class';
    protected $primaryKey = 'cid';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['cid', 'class_name', 'ctype', 'inactive'];

    public function chartTypes()
    {
        return $this->hasMany(ChartType::class, 'class_id', 'cid');
    }

    public function classType()
    {
        return $this->belongsTo(ClassType::class, 'ctype', 'id');
    }
}
