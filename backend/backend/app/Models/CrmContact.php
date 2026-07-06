<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmContact extends Model
{
    use HasFactory;

    protected $table = 'crm_contacts';

    protected $fillable = [
        'person_id',
        'type',
        'action',
        'entity_id',
    ];

    public function person()
    {
        return $this->belongsTo(CrmPersons::class, 'person_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(CrmCategory::class, 'type', 'id');
    }
}
