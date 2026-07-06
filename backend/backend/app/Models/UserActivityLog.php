<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'full_name',
        'user_role',
        'activity_type',
        'module',
        'entity_label',
        'entity_id',
        'http_method',
        'route',
        'description',
        'success',
        'http_status',
        'ip_address',
        'ip_country',
        'ip_region',
        'ip_city',
        'ip_isp',
        'location_summary',
        'user_agent',
        'device_summary',
        'browser',
        'platform',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];
}
