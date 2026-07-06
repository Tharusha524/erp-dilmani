<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
    use HasFactory;

    protected $table = 'payment_terms';
    protected $primaryKey = 'terms_indicator';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'description',
        'payment_type',
        'days_before_due',
        'day_in_following_month',
        'inactive',
    ];

    protected $casts = [
        'inactive' => 'boolean',
    ];

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class, 'payment_type', 'id');
    }

    public function debtors()
    {
        return $this->hasMany(DebtorsMaster::class, 'payment_terms', 'terms_indicator');
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class, 'payment_terms', 'terms_indicator');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'payment_terms', 'terms_indicator');
    }
}
