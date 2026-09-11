<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WoSheetFactoryCategory extends Model
{
    protected $table = 'wo_sheet_factory_categories';

    protected $fillable = [
        'name',
    ];
}
