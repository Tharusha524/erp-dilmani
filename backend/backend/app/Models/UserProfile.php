<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class UserProfile extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'user_profiles';

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
        'status',
        'image',
    ];

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
        ];
    }

    public function securityRole()
    {
        return $this->belongsTo(SecurityRole::class, 'role', 'role');
    }
}