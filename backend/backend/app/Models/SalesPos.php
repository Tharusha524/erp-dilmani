<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesPos extends Model
{
    // Table name (if not plural of model)
    protected $table = 'sales_pos';

    // Primary key
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';   // smallint still maps to int

    // No guarded attributes (or use fillable)
    protected $fillable = [
        'pos_name',
        'cash_sale',
        'credit_sale',
        'pos_location',
        'pos_account',
        'inactive',
    ];

    // Relationships

    // POS belongs to an inventory location
    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'pos_location', 'loc_code');
    }

    // POS belongs to a bank account
    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class, 'pos_account', 'id');
    }
}
