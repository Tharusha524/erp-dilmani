<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserLoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'full_name',
        'user_role',
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
        'success',
        'logged_in_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'logged_in_at' => 'datetime',
    ];
}
