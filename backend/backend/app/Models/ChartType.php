<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartType extends Model
{
    use HasFactory;

    protected $table = 'chart_types';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'class_id', 'parent', 'inactive'];

    public function chartClass()
    {
        return $this->belongsTo(ChartClass::class, 'class_id', 'cid');
    }

    public function chartMasters()
    {
        return $this->hasMany(ChartMaster::class, 'account_type', 'id');
    }
}
