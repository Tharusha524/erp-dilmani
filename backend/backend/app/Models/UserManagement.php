<?php

namespace App\Models;

use App\Models\SecurityRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Casts\Attribute;

class UserManagement extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user_managements';

    protected $fillable = [
        'first_name',
        'last_name',
        'department',
        'epf',
        'telephone',
        'address',
        'email',
        'password',
        'role',
        'sections',
        'areas',
        'strict_access',
        'image',
        'status'
    ];

    protected $appends = ['name'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'strict_access' => 'boolean',
        ];
    }

    /**
     * Relationship to security role.
     */
    public function securityRole()
    {
        return $this->belongsTo(SecurityRole::class, 'role', 'role');
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn($value, array $attributes) => !empty($attributes['image']) ? url('api/storage-file/' . $attributes['image']) : null,
        );
    }

    /**
     * Several screens built against the old `users` table expect a single
     * `name` field (POS Shifts, cashier/void/price-override reports).
     * Rather than touch every one of them, expose the same shape here.
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn($value, array $attributes) => trim(($attributes['first_name'] ?? '') . ' ' . ($attributes['last_name'] ?? '')),
        );
    }
}