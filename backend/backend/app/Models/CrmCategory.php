<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmCategory extends Model
{
    use HasFactory;

    protected $table = 'crm_categories';
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'type',
        'subtype',
        'name',
        'description',
        'systm',
        'inactive',
    ];

    protected $casts = [
        'systm' => 'boolean',
        'inactive' => 'boolean',
    ];

    public function contacts()
    {
        return $this->hasMany(CrmContact::class, 'type', 'id');
    }

}
