<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WoSheetBranch extends Model
{
    protected $table = 'wo_sheet_branches';

    protected $fillable = [
        'name',
    ];
}
