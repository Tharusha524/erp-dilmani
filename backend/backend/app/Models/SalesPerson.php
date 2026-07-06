<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesPerson extends Model
{
    protected $table = 'sales_people';

    protected $fillable = [
        'name',
        'telephone',
        'fax',
        'email',
        'provision',
        'turnover_break_point',
        'provision2',
        'inactive',
    ];

    public function branches()
    {
        return $this->hasMany(CustomerBranch::class, 'sales_person', 'id');
    }
}
