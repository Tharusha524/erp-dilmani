<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesGroup extends Model
{
    use HasFactory;

    protected $table = 'sales_groups';

    protected $fillable = [
        'name',
        'inactive',
    ];

    public function branches()
    {
        return $this->hasMany(CustomerBranch::class, 'sales_group', 'id');
    }
}
