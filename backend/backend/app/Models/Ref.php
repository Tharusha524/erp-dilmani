<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ref extends Model
{
    use HasFactory;

    protected $table = 'refs';
    protected $primaryKey = null;
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'type',
        'reference',
    ];

    public function refLine()
    {
        return $this->belongsTo(RefLine::class, 'type', 'trans_type');
    }
}