<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    protected $table = 'subcategories';

    protected $fillable = ['category_id', 'brand_id', 'name', 'inactive'];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id', 'category_id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }
}
