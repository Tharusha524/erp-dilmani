<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLocation extends Model
{
    use HasFactory;

    // Table name (optional if Laravel can guess it)
    protected $table = 'inventory_locations';

    // Primary key (by default it's "id", so no need to redefine)
    protected $primaryKey = 'id';

    // Fillable fields (for mass assignment)
    protected $fillable = [
        'loc_code',
        'location_name',
        'contact',
        'delivery_address',
        'phone',
        'phone2',
        'fax',
        'email',
        'inactive',
    ];

    public function branches()
    {
        return $this->hasMany(CustomerBranch::class, 'inventory_location', 'loc_code');
    }

    public function stockMoves()
    {
        return $this->hasMany(StockMove::class, 'loc_code', 'loc_code');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'from_stk_loc', 'loc_code');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchOrder::class, 'into_stock_location','loc_code');
    }

    public function grnBatches()
    {
        return $this->hasMany(GrnBatch::class, 'loc_code', 'loc_code');
    }

    public function boms()
    {
        return $this->hasMany(Bom::class, 'loc_code', 'loc_code');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'loc_code', 'loc_code');
    }

    public function woRequirements()
    {
        return $this->hasMany(WORequirement::class, 'loc_code', 'loc_code');
    }

    public function woIssues()
    {
        return $this->hasMany(WOIssue::class, 'loc_code', 'loc_code');
    }
}
