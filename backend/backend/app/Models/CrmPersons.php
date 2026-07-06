<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmPersons extends Model
{
    use HasFactory;

    protected $table = 'crm_persons';

    protected $fillable = [
        'ref',
        'name',
        'name2',
        'address',
        'phone',
        'phone2',
        'fax',
        'email',
        'lang',
        'notes',
        'inactive',
    ];

    protected $casts = [
        'inactive' => 'boolean',
    ];

    public function contacts()
    {
        return $this->hasMany(CrmContact::class, 'person_id', 'id');
    }

}
