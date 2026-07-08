<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMaster extends Model
{
    use HasFactory;

    protected $table = 'stock_master';
    protected $primaryKey = 'stock_id';
    public $incrementing = false; // because stock_id is a string, not auto-increment
    protected $keyType = 'string';
    protected $appends = ['image_url'];

    protected $fillable = [
        'stock_id',
        'category_id',
        'tax_type_id',
        'description',
        'long_description',
        'units',
        'mb_flag',
        'sales_account',
        'cogs_account',
        'inventory_account',
        'adjustment_account',
        'wip_account',
        'cost_center_id',
        'cost_center2_id',
        'purchase_cost',
        'salvage_value',
        'useful_life_years',
        'material_cost',
        'labour_cost',
        'overhead_cost',
        'inactive',
        'no_sale',
        'no_purchase',
        'editable',
        'depreciation_method',
        'depreciation_rate',
        'depreciation_factor',
        'depreciation_start',
        'depreciation_date',
        'fa_class_id',
        'image',
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id', 'category_id');
    }

    public function taxType()
    {
        return $this->belongsTo(ItemTaxTypes::class, 'tax_type_id', 'id');
    }

    public function itemType()
    {
        return $this->belongsTo(ItemType::class, 'mb_flag', 'id');
    }

    public function unit()
    {
        return $this->belongsTo(ItemUnit::class, 'units', 'id');
    }

    public function faClass()
    {
        return $this->belongsTo(StockFaClass::class, 'fa_class_id', 'fa_class_id');
    }

    public function salesAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'sales_account', 'account_code');
    }

    public function cogsAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'cogs_account', 'account_code');
    }

    public function inventoryAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'inventory_account', 'account_code');
    }

    public function adjustmentAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'adjustment_account', 'account_code');
    }

    public function wipAccount()
    {
        return $this->belongsTo(ChartMaster::class, 'wip_account', 'account_code');
    }

    public function itemCodes()
    {
        return $this->hasMany(ItemCode::class, 'stock_id', 'stock_id');
    }

    public function stockMoves()
    {
        return $this->hasMany(StockMove::class, 'stock_id', 'stock_id');
    }

    public function salesOrderDetails()
    {
        return $this->hasMany(SalesOrderDetail::class, 'stk_code', 'stock_id');
    }

    public function purchOrderDetails()
    {
        return $this->hasMany(PurchOrderDetail::class, 'item_code', 'stock_id');
    }

    public function grnItems()
    {
        return $this->hasMany(GrnItem::class, 'item_code', 'stock_id');
    }

    public function suppInvoiceItems()
    {
        return $this->hasMany(SuppInvoiceItem::class, 'stock_id', 'stock_id');
    }

    public function bomParents()
    {
        return $this->hasMany(Bom::class, 'parent', 'stock_id');
    }

    public function bomComponents()
    {
        return $this->hasMany(Bom::class, 'component', 'stock_id');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'stock_id', 'stock_id');
    }

    public function woRequirements()
    {
        return $this->hasMany(WORequirement::class, 'stock_id', 'stock_id');
    }

    public function woIssueItems()
    {
        return $this->hasMany(WOIssueItem::class, 'stock_id', 'stock_id');
    }

    public function purchData()
    {
        return $this->hasMany(PurchData::class, 'stock_id', 'stock_id');
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => !empty($attributes['image']) ? asset('storage/' . $attributes['image']) : null,
        );
    }
}
