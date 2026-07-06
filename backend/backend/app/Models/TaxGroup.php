<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'description',
        'tax',
    ];

    public function branches()
    {
        return $this->hasMany(CustomerBranch::class, 'tax_group', 'id');
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class, 'tax_group', 'id');
    }

    public function items()
    {
        return $this->hasMany(TaxGroupItem::class, 'tax_group_id');
    }
}
