<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WoSheetFabricType extends Model
{
    protected $table = 'wo_sheet_fabric_types';

    protected $fillable = [
        'name',
    ];
}
