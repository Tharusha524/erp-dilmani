<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetButtonAssignment extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_button_assignments';

    protected $fillable = [
        'button_key',
        'user_id',
    ];
}
