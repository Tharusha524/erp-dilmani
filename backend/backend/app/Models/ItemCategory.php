<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    protected $table = 'item_category';
    protected $primaryKey = 'category_id';

    protected $fillable = [
        'description',
        'dflt_tax_type',
        'dflt_units',
        'dflt_mb_flag',
        'dflt_sales_act',
        'dflt_cogs_act',
        'dflt_inventory_act',
        'dflt_adjustment_act',
        'dflt_wip_act',
        'dflt_dim1',
        'dflt_dim2',
        'inactive',
        'dflt_no_sale',
        'dflt_no_purchase',
    ];

    public function taxType()
    {
        return $this->belongsTo(ItemTaxTypes::class, 'dflt_tax_type');
    }

    public function unit()
    {
        return $this->belongsTo(ItemUnit::class, 'dflt_units');
    }

    public function itemCodes()
    {
        return $this->hasMany(ItemCode::class, 'category_id', 'category_id');
    }
}
