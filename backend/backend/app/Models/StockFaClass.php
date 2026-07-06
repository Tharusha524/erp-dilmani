<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockFaClass extends Model
{
    use HasFactory;

    protected $table = 'stock_fa_class';
    protected $primaryKey = 'fa_class_id';
    public $incrementing = false; // since PK is varchar
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'fa_class_id',
        'parent_id',
        'description',
        'long_description',
        'depreciation_rate',
        'inactive',
    ];
}
