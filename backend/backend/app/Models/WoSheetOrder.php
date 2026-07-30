<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WoSheetOrder extends Model
{
    use HasFactory;

    protected $table = 'wo_sheet_orders';

    protected $fillable = [
        'work_order_no',
        'invoice_reference',
        'branch',
        'order_date',
        'delivery_date',
        'customer',
        'contact_no',
        'kind_of_fabric',
        'description',
        'front_image_path',
        'back_image_path',
        'embroider_front',
        'embroider_back',
        'embroider_sleeves',
        'embroider_others',
        'remark',
        'total_price',
        'advance',
        'balance',
        'server_datetime',
        'factory_code',
        'related_department',
        'category',
        'sub_category',
        'department',
        'created_user_id',
        'allocated_user_id',
        'machine_category',
        'machine_category_no',
        'value_add',
        'order_quantity',
        'process_type',
        'current_status_id',
        'quality_tester_user_id',
        'quality_test_time',
        'final_verify_user_id',
        'final_verify_date',
        'final_hand_over_user_id',
        'final_hand_over_date',
        'reopen_datetime',
    ];

    protected $casts = [
        // Explicit Y-m-d format so these plain-date columns serialize as a
        // bare date (e.g. "2026-07-26"), not a UTC-converted timestamp —
        // otherwise a positive server timezone offset (Asia/Colombo,
        // UTC+5:30) shifts midnight local time back into the previous UTC
        // day, which then reads back one day early everywhere (edit forms,
        // list table, etc.) and makes an untouched date look "changed".
        'order_date' => 'date:Y-m-d',
        'delivery_date' => 'date:Y-m-d',
        'server_datetime' => 'datetime',
        'quality_test_time' => 'datetime',
        'final_verify_date' => 'datetime',
        'final_hand_over_date' => 'datetime',
        'reopen_datetime' => 'datetime',
        'total_price' => 'decimal:2',
        'advance' => 'decimal:2',
        'balance' => 'decimal:2',
        'order_quantity' => 'integer',
    ];

    public function sizes()
    {
        return $this->hasMany(WoSheetOrderSize::class, 'wo_sheet_order_id');
    }

    public function priceItems()
    {
        return $this->hasMany(WoSheetOrderPriceItem::class, 'wo_sheet_order_id');
    }

    public function events()
    {
        return $this->hasMany(WoSheetEvent::class, 'wo_sheet_order_id')->orderBy('created_at');
    }

    public function currentStatus()
    {
        return $this->belongsTo(WoSheetStatus::class, 'current_status_id');
    }
}
