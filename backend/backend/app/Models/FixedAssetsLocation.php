<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FixedAssetsLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'locationCode',
        'locationName',
        'address',
        'phone',
        'secondaryPhone',
        'fax',
        'email',
        'contact',
        'fixedAsset',
        'inactive',
    ];
}
